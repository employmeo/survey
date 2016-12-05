package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Set;

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
import org.springframework.stereotype.Component;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Answer;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.Response;
import com.employmeo.data.model.Survey;
import com.employmeo.data.model.SurveyQuestion;
import com.employmeo.data.model.SurveySection;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.RespondantService;
import com.twilio.sdk.verbs.Play;
import com.twilio.sdk.verbs.Record;
import com.twilio.sdk.verbs.Redirect;
import com.twilio.sdk.verbs.Say;
import com.twilio.sdk.verbs.TwiMLException;
import com.twilio.sdk.verbs.TwiMLResponse;

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
	
	private final int DEFAULT_RECORDING_LENGTH = 120;
	private final int VOICE_QUESTION_TYPE = 16;
    private final String NO_MATCH_AUDIO = "https://s3.amazonaws.com/talytica/media/audio/UnableToMatch.aifc";
    private final String NO_RESPONSE_AUDIO = "https://s3.amazonaws.com/talytica/media/audio/NoResponse.aifc";
    private final String GOODBYE_AUDIO = "https://s3.amazonaws.com/talytica/media/audio/Goodbye.aifc";
	
	
	@Value("${com.talytica.urls.assessment}")
	public String BASE_SURVEY_URL;
	
	@Autowired
	RespondantService respondantService;
	
	@Autowired
	AccountSurveyService accountSurveyService;
	
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
			@ApiParam(value = "RecordingUrl") @FormParam("RecordingUrl") String recUrl,
			@ApiParam(value = "RecordingDuration") @FormParam("RecordingDuration") Integer recDuration) {
		
		log.debug("Twilio Capture Recording called by {} with {} for respondant {} and question {}", 
				twiFrom, recUrl, respondantId, questionId);
		
		Respondant respondant = respondantService.getRespondantById(respondantId);
		if ((questionId != null) && (recUrl != null)) {
			// Save the response
			Response recording = new Response();
			recording.setRespondant(respondant);
			recording.setRespondantId(respondant.getId());
			recording.setResponseMedia(recUrl);
			recording.setResponseValue(recDuration);
			recording.setQuestionId(questionId);
			Response savedRecording = respondantService.saveResponse(recording);
			respondant.getResponses().add(savedRecording);
		}

		// present the next question		
		TwiMLResponse twiML = new TwiMLResponse();
		try {
			nextQuestionTwiML(twiML, respondant);
		} catch (TwiMLException e) {
			e.printStackTrace();
		}

		log.debug("Twilio Capture Recording returned {}", twiML.toEscapedXML());
		return twiML.toEscapedXML();
		
	}

	@GET
	@Path("/nextquestion/{respondantId}")
	@Produces(MediaType.APPLICATION_XML)
	@ApiOperation(value = "Returns twiml with next question or thankyou message")
	public String nextQuestion(@ApiParam(value = "Respondant ID") @PathParam("respondantId") Long respondantId) {
		
		Respondant respondant = respondantService.getRespondantById(respondantId);
		TwiMLResponse twiML = new TwiMLResponse();
		try {
			nextQuestionTwiML(twiML, respondant);
		} catch (TwiMLException e) {
			e.printStackTrace();
		}
		
		log.debug("Twilio Next Question returned {}", twiML.toEscapedXML());
		return twiML.toEscapedXML();
		
	}

	@GET
	@Path("/{asId}/findbyid")
	@Produces(MediaType.APPLICATION_XML)
	@ApiOperation(value = "Finds survey and returns twiml with instructions and first question")
	public String findSurvey(
			@ApiParam(value = "Account Survey ID") @PathParam("asId") Long asId,
			@ApiParam(value = "From") @QueryParam("From") String twiFrom,
			@ApiParam(value = "Digits") @QueryParam("Digits") String twiDigits) {	
		log.info("twilio requested findby id pathparam asid: {} queryparam digits: {}", asId, twiDigits);
		Respondant resp = respondantService.getRespondantByAccountSurveyIdAndPayrollId(asId, twiDigits);
	    TwiMLResponse twiML = new TwiMLResponse();
	    try {

	    	if (resp != null) {
	    		AccountSurvey as = resp.getAccountSurvey();
	    		String preambleMedia = as.getPreambleMedia();

	    		Say found = new Say("Found: " + resp.getPerson().getFirstName() + " " + resp.getPerson().getLastName() + "." );
		    	twiML.append(found);

	    		if ((preambleMedia != null) && (!preambleMedia.isEmpty())) {
	    			Play instructions = new Play(preambleMedia);
	    			twiML.append(instructions);
	    		} else {
	    			Say instructions = new Say(as.getPreambleText());
	    			twiML.append(instructions);
	    		}       	
		    	
	        	nextQuestionTwiML(twiML, resp);
	 
	    	} else {
	    		Play sorry = new Play(NO_MATCH_AUDIO);
	    		twiML.append(sorry);
	    	}
	    } catch (TwiMLException e) {
	        e.printStackTrace();
	    }
	    
		log.debug("Twilio Find By ID returned {}", twiML.toEscapedXML());
	    return twiML.toEscapedXML();	
		
	}
	
	private void nextQuestionTwiML(TwiMLResponse twiML, Respondant respondant) throws TwiMLException {
	    // get Survey Questions & sort
	    SurveyQuestion nextQuestion = nextQuestion(respondant);
        if (nextQuestion != null) {  
	        Say prompt = new Say("Question " + nextQuestion.getSequence() + ". ");
	        twiML.append(prompt);
	        String media = nextQuestion.getQuestion().getQuestionMedia();
	        if ((media != null) && (!media.isEmpty())) {
	        	Play ques = new Play(media);
	        	twiML.append(ques);
	        } else {
	        	Say ques = new Say(nextQuestion.getQuestion().getQuestionText());
	        	twiML.append(ques);
	        }
	        Record record = new Record();
	        record.setMethod("POST");
	        record.setAction(BASE_SURVEY_URL + "/survey/1/twilio/capture/" + 
	            respondant.getId() + "/"  + nextQuestion.getQuestion().getQuestionId());
	        
	        Integer length = null;
	        Set<Answer> answers = nextQuestion.getQuestion().getAnswers();
	        for (Answer ans : answers) {
	        	length = ans.getAnswerValue();
	        	record.setMaxLength(length);
	        	break;
	        }
	        if (null == length) record.setMaxLength(DEFAULT_RECORDING_LENGTH);
	
	        Play tryagain = new Play(NO_RESPONSE_AUDIO);
	        Redirect redirect = new Redirect(BASE_SURVEY_URL + "/survey/1/twilio/nextquestion/" + respondant.getId());
	        redirect.setMethod("GET");
	    	twiML.append(record);
	    	twiML.append(tryagain);
	    	twiML.append(redirect);

        } else {
        	String thankyouMedia = respondant.getAccountSurvey().getThankyouMedia();
        	if (null == thankyouMedia) thankyouMedia = GOODBYE_AUDIO;;
	        Play goodbye = new Play(thankyouMedia);
    	    twiML.append(goodbye);
    	    
    	    // Submit the Survey
			if (respondant.getRespondantStatus() < Respondant.STATUS_COMPLETED) {
				respondant.setRespondantStatus(Respondant.STATUS_COMPLETED);
				respondant.setFinishTime(new Timestamp(new Date().getTime()));
				respondantService.save(respondant);
			}
        }
	}
	
	private SurveyQuestion nextQuestion(Respondant respondant) {
		SurveyQuestion nextQuestion = null;
		List<SurveyQuestion> questions = new ArrayList<SurveyQuestion>(respondant.getAccountSurvey().getSurvey().getSurveyQuestions());
		questions.sort(new Comparator<SurveyQuestion>() {
			public int compare(SurveyQuestion sq1, SurveyQuestion sq2) {
		    	int result = sq1.getPage() - sq2.getPage();
		    	if (result == 0) result = sq1.getSequence() - sq2.getSequence();
		    	return result;
			}
		});
		
		// get responses
		List<Response> responses = new ArrayList<Response>(respondant.getResponses());

		for (SurveyQuestion question : questions) {
			boolean isAnswered = false;
			if (!question.getQuestion().getQuestionType().equals(VOICE_QUESTION_TYPE)) break;
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