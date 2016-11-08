package com.talytica.survey.resources;

import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Survey;
import com.employmeo.data.model.SurveyQuestion;
import com.employmeo.data.model.SurveySection;
import com.employmeo.data.model.SurveySectionPK;
import com.employmeo.data.service.SurveyService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;


@Component
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/survey")
@Api( value="/1/survey", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class SurveyResource {
	private static final Logger log = LoggerFactory.getLogger(SurveyResource.class);

	@Autowired
	private SurveyService surveyService;

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of all Surveys", response = Survey.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Surveys found"),
	     @ApiResponse(code = 404, message = "Surveys not found")
	   })	
	public Iterable<Survey> getAllSurveys() {
		return surveyService.getAllSurveys();
	}
	
	@GET
	@Path("/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the survey by provided Id", response = Survey.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Survey found"),
	     @ApiResponse(code = 404, message = "No such Survey found")
	   })	
	public Response getSurvey(@ApiParam(value = "survey id") @PathParam("id") @NotNull Long id) {
		log.debug("Requested survey by id {}", id);
		
		Survey survey = surveyService.getSurveyById(id);
		log.debug("Returning survey by id {} as {}", id, survey);
		
		if(null != survey) {
			return Response.status(Status.OK).entity(survey).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided survey", response = Survey.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Survey saved"),
	   })	
	public Response saveSurvey(Survey survey) {
		log.debug("Requested survey save: {}", survey);
		
		Survey savedSurvey = surveyService.save(survey);
		log.debug("Saved survey {}", savedSurvey);
		
		return Response.status(Status.CREATED).entity(savedSurvey).build();
	}		
	
// --------------------------------------------
	
	@GET
	@Path("/question")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of all SurveyQuestions", response = SurveyQuestion.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "SurveyQuestions found"),
	     @ApiResponse(code = 404, message = "SurveyQuestions not found")
	   })	
	public Iterable<SurveyQuestion> getAllSurveyQuestions() {
		return surveyService.getAllSurveyQuestions();
	}
	
	@GET
	@Path("/question/{id}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the surveyQuestion by provided Id", response = SurveyQuestion.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "SurveyQuestion found"),
	     @ApiResponse(code = 404, message = "No such SurveyQuestion found")
	   })	
	public Response getSurveyQuestion(@ApiParam(value = "surveyQuestion id") @PathParam("id") @NotNull Long id) {
		log.debug("Requested surveyQuestion by id {}", id);
		
		SurveyQuestion surveyQuestion = surveyService.getSurveyQuestionById(id);
		log.debug("Returning surveyQuestion by id {} as {}", id, surveyQuestion);
		
		if(null != surveyQuestion) {
			return Response.status(Status.OK).entity(surveyQuestion).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@POST
	@Path("/question")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided surveyQuestion", response = SurveyQuestion.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "SurveyQuestion saved"),
	   })	
	public Response saveSurveyQuestion(SurveyQuestion surveyQuestion) {
		log.debug("Requested surveyQuestion save: {}", surveyQuestion);
		
		SurveyQuestion savedSurveyQuestion = surveyService.save(surveyQuestion);
		log.debug("Saved surveyQuestion {}", savedSurveyQuestion);
		
		return Response.status(Status.CREATED).entity(savedSurveyQuestion).build();
	}		
		
// ---------------------------------------------------------
	
	@GET
	@Path("/section")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of all SurveySections", response = SurveySection.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "SurveySections found"),
	     @ApiResponse(code = 404, message = "SurveySections not found")
	   })	
	public Iterable<SurveySection> getAllSurveySections() {
		return surveyService.getAllSurveySections();
	}
	
	@GET
	@Path("/{surveyId}/section/{sectionNumber}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the surveySection by provided surveyId and sectionNumber", response = SurveySection.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "SurveySection found"),
	     @ApiResponse(code = 404, message = "No such SurveySection found")
	   })	
	public Response getSurveySection(@ApiParam(value = "survey id") @PathParam("surveyId") @NotNull Long surveyId,
			@ApiParam(value = "section number") @PathParam("sectionNumber") @NotNull Integer sectionNumber) {
		log.debug("Requested surveySection by surveyId {} and sectionNumber {}", surveyId, sectionNumber);
		SurveySectionPK surveySectionPK = new SurveySectionPK(surveyId, sectionNumber);
		SurveySection surveySection = surveyService.getSurveySectionById(surveySectionPK);
		log.debug("Returning surveySection by pk {} as {}", surveySectionPK, surveySection);
		
		if(null != surveySection) {
			return Response.status(Status.OK).entity(surveySection).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}	
	
	@POST
	@Path("/section")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided surveySection", response = SurveySection.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "SurveySection saved"),
	   })	
	public Response saveSurveySection(SurveySection surveySection) {
		log.debug("Requested surveySection save: {}", surveySection);
		
		SurveySection savedSurveySection = surveyService.save(surveySection);
		log.debug("Saved surveySection {}", savedSurveySection);
		
		return Response.status(Status.CREATED).entity(savedSurveySection).build();
	}		
		
}
