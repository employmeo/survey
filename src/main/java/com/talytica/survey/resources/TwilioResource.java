package com.talytica.survey.resources;

import java.net.URI;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Answer;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.Response;
import com.employmeo.data.model.Survey;
import com.employmeo.data.model.SurveyQuestion;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.RespondantService;
import com.talytica.common.service.ExternalLinksService;
import com.talytica.common.service.ServerAdminService;
import com.talytica.survey.objects.CallMeRequest;
import com.twilio.Twilio;
import com.twilio.http.HttpMethod;
import com.twilio.http.TwilioRestClient;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.CallCreator;
import com.twilio.twiml.TwiMLException;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Play;
import com.twilio.twiml.voice.Record;
import com.twilio.twiml.voice.Redirect;
import com.twilio.twiml.voice.Say;
import com.twilio.type.PhoneNumber;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
@Produces(MediaType.APPLICATION_XML)
@Path("/1/twilio")
@Api( value="/1/twilio", produces=MediaType.APPLICATION_XML, consumes=MediaType.APPLICATION_FORM_URLENCODED)
public class TwilioResource {
	 
	private final int DEFAULT_RECORDING_LENGTH = 480;
	private final int DEFAULT_RECORDING_TIMEOUT = 10;
	private final int VOICE_QUESTION_TYPE = 16;
    private final String COMPLETED_AUDIO = "https://s3.amazonaws.com/talytica/media/audio/InterviewComplete.mp3";
    private final String NO_MATCH_AUDIO = "https://s3.amazonaws.com/talytica/media/audio/UnableToMatchTryAgain.mp3";
    private final String NO_RESPONSE_AUDIO = "https://s3.amazonaws.com/talytica/media/audio/NoResponseTryAgain.mp3";
    private final String GOODBYE_AUDIO = "https://s3.amazonaws.com/talytica/media/audio/Goodbye.aifc";
    private final String RETURNTOBROWSER = "https://s3.amazonaws.com/talytica/media/audio/Goodbye.aifc";
	
	@Value("${com.talytica.urls.assessment}")
	public String BASE_SURVEY_URL;
	@Value("${com.talytica.apis.twilio.sid}")
	private String ACCOUNT_SID;
	@Value("${com.talytica.apis.twilio.token}")
	private String AUTH_TOKEN;
	
	
	@Autowired
	RespondantService respondantService;
	
	@Autowired
	AccountSurveyService accountSurveyService;
	
	@Autowired
	ExternalLinksService externalLinksService;
	
	@Autowired
	SimpMessagingTemplate simpMessagingTemplate;
	
	@Autowired
	ServerAdminService serverAdminService;

	
	/*******************
	 * For all voice data Collection using the Twilio API, the following
	 * parameters come with the API call from Twilio:
	 * allSid	A unique identifier for this call, generated by Twilio.
	 * @param AccountSid	Your Twilio account id. It is 34 characters long,
	 * 						and always starts with the letters AC.
	 * @param From			The phone number, URI or client identifier
	 * @param To			The phone number, URI or client identifier
	 * @param CallStatus	A descriptive status for the call. The value is
	 * 						one of queued, ringing, in-progress, completed, 
	 * 						busy, failed or no-answer.
	 * @param ApiVersion	The version of the Twilio API.
	 * @param Direction		A string describing the direction of the call.
	 * @param ForwardedFrom	This parameter is set only when Twilio receives 
	 * 						a forwarded call, but depends on the carrier
	 * @param CallerName	VoiceCallerIdLookup value ($0.01 per look up).
	 * @return TwiML 		Response
	 */
	
	
	@POST
	@Path("/capture/{respondantId}/{questionId}")
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_XML)
	@ApiOperation(value = "Saves a media recording from twilio and returns twiml with next question")
	public String captureRecording(
			@ApiParam(value = "Respondant ID") @PathParam("respondantId") Long respondantId,
			@ApiParam(value = "Question ID") @PathParam("questionId") Long questionId,
			@ApiParam(value = "From") @FormParam("From") String twiFrom,
			@ApiParam(value = "Digits") @FormParam("Digits") String digits,
			@ApiParam(value = "RecordingUrl") @FormParam("RecordingUrl") String recUrl,
			@ApiParam(value = "RecordingDuration") @FormParam("RecordingDuration") Integer recDuration) {
		
		log.debug("Twilio Capture Recording called by {} with {} for respondant {} and question {}", 
				twiFrom, recUrl, respondantId, questionId);
		
		Respondant respondant = respondantService.getRespondantById(respondantId);
		if ((recDuration <= DEFAULT_RECORDING_TIMEOUT)&&((null == digits)||(digits.isEmpty()))) {
			log.debug("Empty ({} second) recording: {}", recDuration, recUrl);
			recUrl = null; // don't accept
		}
		if ((questionId != null) && (recUrl != null)) {
			// Save the response
			Response recording = new Response();
			recording.setRespondant(respondant);
			recording.setRespondantId(respondant.getId());
			recording.setResponseMedia(recUrl);
			recording.setResponseValue(recDuration);
			recording.setQuestionId(questionId);
			respondantService.saveResponse(recording);
		}

		// present the next question		
		VoiceResponse.Builder twiML = new VoiceResponse.Builder();
		try {
			nextQuestionTwiML(twiML, respondant);
		} catch (TwiMLException e) {
			e.printStackTrace();
		}

		log.debug("Twilio Capture Recording returned {}", twiML.build().toXml());
		return twiML.build().toXml();
		
	}

	@GET
	@Path("/nextquestion/{respondantId}")
	@Produces(MediaType.APPLICATION_XML)
	@ApiOperation(value = "Returns twiml with next question or thankyou message")
	public String nextQuestion(@ApiParam(value = "Respondant ID") @PathParam("respondantId") Long respondantId) {
		
		Respondant respondant = respondantService.getRespondantById(respondantId);
		VoiceResponse.Builder twiML = new VoiceResponse.Builder();
		try {
			nextQuestionTwiML(twiML, respondant);
		} catch (TwiMLException e) {
			e.printStackTrace();
		}
		
		log.debug("Twilio Capture Recording returned {}", twiML.build().toXml());
		return twiML.build().toXml();
		
	}

	@GET
	@Path("/{asId}/findbyid")
	@Produces(MediaType.APPLICATION_XML)
	@ApiOperation(value = "Finds survey and returns twiml with instructions and first question")
	public String findSurvey(
			@ApiParam(value = "Account Survey ID") @PathParam("asId") Long asId,
			@ApiParam(value = "From") @QueryParam("From") String twiFrom,
			@ApiParam(value = "Digits") @QueryParam("Digits") String twiDigits,
			@ApiParam(value = "AnsweredBy") @QueryParam("AnsweredBy") String answeredBy) {	
		log.info("twilio requested findby id pathparam asid: {} queryparam digits: {} and answeredBy {}", asId, twiDigits, answeredBy);
		Respondant resp = respondantService.getRespondantByAccountSurveyIdAndPayrollId(asId, twiDigits);
		VoiceResponse.Builder twiML = new VoiceResponse.Builder();
	    try {
	    	if (resp != null) {
	    		if (resp.getRespondantStatus() >= Respondant.STATUS_COMPLETED) {
		    		twiML.play(new Play.Builder(COMPLETED_AUDIO).build());
	    		} else {
		    		AccountSurvey as = resp.getAccountSurvey();
		    		String preambleMedia = as.getPreambleMedia();
		    		
		    		Say found = new Say.Builder("Found: " + resp.getPerson().getFirstName() + " " + resp.getPerson().getLastName() + "." ).build();
		    		// Using price to customize if we say "found user" - because Papa is only high priced customer who asked for this
		    		if (null == as.getPrice() || as.getPrice() < 1000d) twiML.say(found);
	
		    		if ((preambleMedia != null) && (!preambleMedia.isEmpty())) {
		    			twiML.play(new Play.Builder(preambleMedia).build());
		    		} else {
		    			twiML.say(new Say.Builder(as.getPreambleText()).build());
		    		}       	

		    		// Check if answered by machine (in call-me situation)
		    		if (answeredBy != null && !answeredBy.equalsIgnoreCase("human")) {
		    	        Gather pressToContinue = new Gather.Builder()
		    	        		.numDigits(1)
		    	        		.say(new Say.Builder("Press 1 to Continue").build())
		    	        		.action((BASE_SURVEY_URL + "/survey/1/twilio/nextquestion/" + resp.getId()))
		    	        		.build();

		    	    	twiML.gather(pressToContinue);		
		    		} else {
		    			nextQuestionTwiML(twiML, resp);
		    		}
	    		}
	    	} else {
	    		Play sorry = new Play.Builder(NO_MATCH_AUDIO).build();
	    		Gather gather = new Gather.Builder()
	    				.action(BASE_SURVEY_URL+"/survey/1/twilio/"+asId+"/findbyid")
	    				.method(HttpMethod.GET)
	    				.build();
	    		twiML.play(sorry);
	    		twiML.gather(gather);
	    		log.warn("No Match: Caller {} provided id: {} ", twiFrom, twiDigits);
	    	}
	    } catch (TwiMLException e) {
	        e.printStackTrace();
	    }
	    
		log.debug("Twilio Find By ID returned {}", twiML.build().toXml());
	    return twiML.build().toXml();	
		
	}

	@GET
	@Path("/findbyrespondant")
	@Produces(MediaType.APPLICATION_XML)
	@ApiOperation(value = "Finds survey and returns twiml with instructions and first question")
	public String findRespondantSurvey(
			@ApiParam(value = "From") @QueryParam("From") String twiFrom,
			@ApiParam(value = "Digits") @QueryParam("Digits") String twiDigits) {
		Long respondantId = Long.valueOf(twiDigits);
		log.info("twilio requested findby id respondant id: {}",respondantId);
		Respondant resp = respondantService.getRespondantById(respondantId);
		
		VoiceResponse.Builder twiML = new VoiceResponse.Builder();
	    try {
	    	if (resp != null) {
	    		if (resp.getRespondantStatus() >= Respondant.STATUS_COMPLETED) {
		    		twiML.play(new Play.Builder(COMPLETED_AUDIO).build());
	    		} else {
		    		AccountSurvey as = resp.getAccountSurvey();
		    		String preambleMedia = as.getPreambleMedia();
	
		    		Say found = new Say.Builder("Found: " + resp.getPerson().getFirstName() + " " + resp.getPerson().getLastName() + "." ).build();
			    	twiML.say(found);
	
		    		if ((preambleMedia != null) && (!preambleMedia.isEmpty())) {
		    			twiML.play(new Play.Builder(preambleMedia).build());
		    		} else {
		    			twiML.say(new Say.Builder(as.getPreambleText()).build());
		    		}       	
			    	
		        	nextQuestionTwiML(twiML, resp);
	    		}
	    	} else {
	    		Play sorry = new Play.Builder(NO_MATCH_AUDIO).build();
	    		Gather gather = new Gather.Builder()
	    				.action(BASE_SURVEY_URL+"/survey/1/findbyrespondant")
	    				.method(HttpMethod.GET)
	    				.build();
	    		twiML.play(sorry);
	    		twiML.gather(gather);
	    		log.warn("No Match: Caller {} provided id: {} ", twiFrom, twiDigits);
	    	}
	    } catch (TwiMLException e) {
	        e.printStackTrace();
	    }
	    
		log.debug("Twilio Find By ID returned {}", twiML.build().toXml());
	    return twiML.build().toXml();	
		
	}
	
	@POST
	@Path("/callMe")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Places outbound call")
	public CallMeRequest callMe(@ApiParam(value = "Call Me Request") CallMeRequest request) throws Exception {
		Twilio.init(ACCOUNT_SID, AUTH_TOKEN);
		TwilioRestClient client = Twilio.getRestClient();
		Respondant respondant = respondantService.getRespondant(request.uuid);
		
		// Build the parameters 
		List<String> params = new ArrayList<String>(); 
	    params.add("initiated");
	    params.add("ringing");
	    params.add("answered");
	    params.add("completed");
		
	    PhoneNumber to = new PhoneNumber(request.phoneNumber);
	    PhoneNumber from = new PhoneNumber(respondant.getAccountSurvey().getPhoneNumber());
	     
	    CallCreator creator = new CallCreator(to, from, new URI(externalLinksService.getCallMeLink(respondant)));
	    creator.setMethod(HttpMethod.GET);
	    creator.setStatusCallbackMethod(HttpMethod.POST);
	    creator.setStatusCallback(externalLinksService.getCallStatusLink());
	    creator.setStatusCallbackEvent(params);
	    // AMD would be cool - but nobody wants it.
	    // if (null != respondant.getAccountSurvey().getPrice() && respondant.getAccountSurvey().getPrice() > 1000d) 
	    //	creator.setMachineDetection("Enable");
	    
	    Call call = creator.create(client);			
		log.debug("Outbound call id {}, made to {}",call.getSid(),request.phoneNumber);
		request.sid = call.getSid();
		return request;
	}
		
	@POST
	@Path("/status")
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_XML)
	@ApiOperation(value = "Handles status call-backs about a call")
	public void broadcastCallStatus(
			@ApiParam(value = "CallSid") @FormParam("CallSid") String callSid,
			@ApiParam(value = "CallStatus") @FormParam("CallStatus") String status)  {
		simpMessagingTemplate.convertAndSend("/calls/"+callSid, status);
	}

	private void nextQuestionTwiML(VoiceResponse.Builder twiML, Respondant respondant) throws TwiMLException {
	    // get Survey Questions & sort
	    SurveyQuestion nextQuestion = nextQuestion(respondant);
        if (nextQuestion != null) {
	        Say prompt = new Say.Builder("Question " + nextQuestion.getSequence() + ". ").build();
	        if (nextQuestion.getQuestion().getDirection() <= 0) twiML.say(prompt);
	        String media = nextQuestion.getQuestion().getQuestionMedia();
	        if ((media != null) && (!media.isEmpty())) {
	        	Play ques = new Play.Builder(media).build();
	        	twiML.play(ques);
	        } else {
	        	Say ques = new Say.Builder(nextQuestion.getQuestion().getQuestionText()).build();
	        	twiML.say(ques);
	        }
	        
	        
	        Integer length = null;
	        Set<Answer> answers = nextQuestion.getQuestion().getAnswers();
	        for (Answer ans : answers) {
	        	length = ans.getAnswerValue();
	        	break;
	        }
	        if (null == length) length = DEFAULT_RECORDING_LENGTH;
	        
	        Record record = new Record.Builder()
	        	.method(HttpMethod.POST)
	        	.maxLength(length)
	        	.timeout(DEFAULT_RECORDING_TIMEOUT)
	        	.action(BASE_SURVEY_URL + "/survey/1/twilio/capture/" + 
	            respondant.getId() + "/"  + nextQuestion.getQuestion().getQuestionId())
	        	.build();
	        
	
	        Play tryagain = new Play.Builder(NO_RESPONSE_AUDIO).build();
	        Redirect redirect = new Redirect.Builder(BASE_SURVEY_URL + "/survey/1/twilio/nextquestion/" + respondant.getId())
	        		.method(HttpMethod.GET)
	        		.build();

	    	twiML.record(record);
	    	twiML.play(tryagain);
	    	twiML.redirect(redirect);

        } else if (Survey.TYPE_MULTI == respondant.getAccountSurvey().getSurvey().getSurveyType()) {  	
        	String thankyouMedia = respondant.getAccountSurvey().getThankyouMedia();
        	if (null == thankyouMedia) thankyouMedia = RETURNTOBROWSER;
	        Play goodbye = new Play.Builder(thankyouMedia).build();
    	    twiML.play(goodbye);
        } else {   	
        	String thankyouMedia = respondant.getAccountSurvey().getThankyouMedia();
        	if (null == thankyouMedia) thankyouMedia = GOODBYE_AUDIO;
	        Play goodbye = new Play.Builder(thankyouMedia).build();
    	    twiML.play(goodbye);
    	    
    	    // Submit the Survey
			if (respondant.getRespondantStatus() < Respondant.STATUS_COMPLETED) {
				respondant.setRespondantStatus(Respondant.STATUS_COMPLETED);
				respondant.setFinishTime(new Timestamp(new Date().getTime()));
				respondantService.save(respondant);
				log.info("Account: {} VOICE SURVEY COMPLETE for respondant id: {}",
						respondant.getAccount().getAccountName(),
						respondant.getId());
				//serverAdminService.triggerPipeline("scoring");
			}
        }
	}
	
	private SurveyQuestion nextQuestion(Respondant respondant) {
		SurveyQuestion nextQuestion = null;
		List<SurveyQuestion> questions = respondant.getAccountSurvey().getSurvey().getSurveyQuestions().stream()
				.filter(surveyQuestion -> VOICE_QUESTION_TYPE == surveyQuestion.getQuestion().getQuestionType())
                .collect(Collectors.toList());
		Collections.sort(questions);
		Set<Response> responses = respondantService.getResponsesToQuestions(respondant.getId(),questions);

		log.debug("{} audio questions with {} associated responses", questions.size(),responses.size());
		for (SurveyQuestion question : questions) {
			boolean isAnswered = false;
			for (Response answer : responses) {
				if (question.getQuestion().getQuestionId().equals(answer.getQuestionId())) {
					isAnswered = true;
					break;
				}
			}
			if (!isAnswered) {
				nextQuestion = question;
				break;
			}
		}
		return nextQuestion;	    
	}
		
}