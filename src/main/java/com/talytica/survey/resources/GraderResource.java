package com.talytica.survey.resources;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import javax.annotation.security.PermitAll;
import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Answer;
import com.employmeo.data.model.Criterion;
import com.employmeo.data.model.Grade;
import com.employmeo.data.model.Grader;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Question;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.SurveyQuestion;
import com.employmeo.data.service.GraderService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.QuestionService;
import com.employmeo.data.service.RespondantService;
import com.talytica.survey.objects.NewGrader;
import com.talytica.survey.objects.OrderAssessment;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@PermitAll
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/grader")
@Api( value="/1/grader", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class GraderResource {
	@Autowired
	GraderService graderService;
	
	@Autowired
	RespondantService respondantService;

	@Autowired
	PersonService personService;
	
	@Autowired
	QuestionService questionService;

	@GET
	@Path("/{uuid}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets grader based on uuid", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Grader found"),
	     @ApiResponse(code = 404, message = "Grader not found")
	   })
	public Response getGraderByUserId(@ApiParam(value = "user id") @PathParam("uuid") @NotNull UUID uuId) {
		log.debug("Requested grader by uuid {}", uuId);

		Grader grader = graderService.getGraderByUuid(uuId);
		if (null == grader) Response.status(Status.GONE).entity("Reference Request not found for this ID.").build();
		if (grader.getStatus() >= 10) return Response.status(Status.GONE).entity("This reference request has already been completed and submitted.").build();
		return Response.status(Status.OK).entity(grader).build();

	}

	@GET
	@Path("/{uuid}/grades")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets list of the grades for grader", response = Grade.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Grades found"),
	     @ApiResponse(code = 404, message = "Grader not found")
	   })
	public Response getGradesByGraderId(@ApiParam(value = "user id") @PathParam("uuid") @NotNull UUID uuId) {
		log.debug("Requested grades by grader uuid {}", uuId);
		Grader grader = graderService.getGraderByUuid(uuId);
		if (null == grader) Response.status(Status.GONE).entity("Reference Request not found for this ID.").build();
		List<Grade> grades = graderService.getGradesByGraderId(grader.getId());
		return Response.status(Status.OK).entity(grades).build();

	}

	@GET
	@Path("/{uuid}/criteria")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets a list of the criteria (questions) for a grader", response = Criterion.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Criteria found")
	   })
	public Response getCriteriaByGraderId(@ApiParam(value = "grader id") @PathParam("uuid") @NotNull UUID uuId) {
		Grader grader = graderService.getGraderByUuid(uuId);
		List<Criterion> criteria = graderService.getCriteriaListByQuestionId(grader.getQuestionId());
		log.debug("Found {} criteria for grader uuid {}", criteria.size(), uuId);
		return Response.status(Status.OK).entity(criteria).build();
	}

	@POST
	@Path("/grade")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided grade", response = Grade.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Grade Saved"),
	   })
	public Response saveGrade(@ApiParam(value = "grade") Grade grade) {
		log.debug("Requested grade save: {}", grade);
		if ((null == grade.getGradeText()) || (grade.getGradeText().isEmpty())) grade.setGradeText(textByAnswer(grade, false));
		if (grade.getIsSummary()) graderService.setSummary(grade.getGraderId(),textByAnswer(grade, true));
		if (grade.getIsRelationship()) graderService.setRelationship(grade.getGraderId(), textByAnswer(grade, true));			
		Grade savedGrade = graderService.saveGrade(grade);
		log.debug("Saved grade {}", savedGrade);
		return Response.status(Status.CREATED).entity(savedGrade).build();
	}

	@POST
	@Path("/{uuid}/submit")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the status of specified grader", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Status update accepted"),
	   })
	public Response submitGrader(
			@Context final HttpServletRequest reqt,
			@ApiParam(value = "grader id") @PathParam("uuid") UUID uuId) {
		log.debug("Requested grader id: {} status update to {}", uuId, Grader.STATUS_COMPLETED);
		Grader grader = graderService.getGraderByUuid(uuId);		
		if (grader != null) {
			grader.setUserAgent(reqt.getHeader("User-Agent"));
			grader.setIpAddress(reqt.getRemoteAddr());
			grader.setStatus(Grader.STATUS_COMPLETED);
			Grader savedGrader = graderService.save(grader);
			log.debug("Saved grader {}", savedGrader);
			return Response.status(Status.CREATED).entity(savedGrader).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}
	
	@POST
	@Path("/new")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Creates a new grader for a specified respondant", response = Respondant.class)
	  @ApiResponses(value = {
      @ApiResponse(code = 201, message = "Grader saved")})	
	public Response newGrader(	
	 @ApiParam("Assessment Order") NewGrader newGrader, @Context final HttpServletRequest reqt) {
		Respondant resp = respondantService.getRespondant(newGrader.respondantUuid);

		Person person = new Person();
		person.setEmail(newGrader.email);
		person.setFirstName(newGrader.fname);
		person.setLastName(newGrader.lname);
		person.setPhone(newGrader.phone);
		Person savedPerson = personService.save(person);
		Grader grader = new Grader();
		grader.setAccount(resp.getAccount());
		grader.setAccountId(resp.getAccountId());
		AccountSurvey aSurvey = resp.getAccountSurvey();
		Set<SurveyQuestion> questions = aSurvey.getSurvey().getSurveyQuestions();
		log.debug("questions are {}", questions);
		Optional<SurveyQuestion> question = questions.stream()
        .filter(sq -> sq.getQuestion().getScoringModel() == "reference")
        .findFirst();
		
		grader.setUserAgent(reqt.getHeader("User-Agent"));
		grader.setIpAddress(reqt.getRemoteAddr());
		
		grader.setPerson(savedPerson);
		grader.setPersonId(savedPerson.getId());
		grader.setStatus(Grader.STATUS_STARTED);
		
		if(question.isPresent()) {
			grader.setQuestion(question.get().getQuestion());
			grader.setQuestionId(question.get().getQuestionId());
		}
		grader.setRcConfig(aSurvey.getRcConfig());
		grader.setRcConfigId(aSurvey.getRcConfigId());

		grader.setRespondant(resp);
		grader.setRespondantId(resp.getId());
		
		Grader savedGrader = graderService.save(grader);
		
		return Response.status(Status.CREATED).entity(savedGrader).build();
	}
	
	@GET
	@Path("/{uuid}/decline")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the status of specified grader", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Status update accepted"),
	   })
	public Response declineGrader(@ApiParam(value = "grader id") @PathParam("uuid") UUID uuId) throws Exception {
		log.debug("Requested grader id: {} status update to {}", uuId, Grader.STATUS_IGNORED);
		Grader grader = graderService.getGraderByUuid(uuId);
		if (grader != null) {
			grader.setStatus(Grader.STATUS_IGNORED);
			Grader savedGrader = graderService.save(grader);
			log.debug("Declined grader {}", savedGrader);
		} 
		return Response.seeOther(new URI("/thankyou.htm")).build();
	}
	
	private String textByAnswer(Grade grade, Boolean forceResponse) {
		if ((grade.getGradeText() != null) && (!grade.getGradeText().isEmpty())) return grade.getGradeText();
		Question question = questionService.getQuestionById(grade.getQuestionId());
		Set<Answer> answers = question.getAnswers();
		if (answers.size() > 0) log.debug("Grade {} consulting {} answers for text", grade.getGraderId(),answers.size());
		for (Answer answer : answers) {
			if (answer.getAnswerValue() == grade.getGradeValue()) return answer.getAnswerText();
		}

		if (forceResponse) return String.format("%d", grade.getGradeValue());
		log.debug("No answer forced, returning empty grade");
		return grade.getGradeText();
	}
}
