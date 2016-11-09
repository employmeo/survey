package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import javax.annotation.security.PermitAll;
import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.SurveyService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@Component
@PermitAll
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/respondant")
@Api( value="/1/respondant", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class RespondantResource {
	private static final Logger log = LoggerFactory.getLogger(RespondantResource.class);

	@Autowired
	private AccountSurveyService accountSurveyService;
	@Autowired
	private RespondantService respondantService;
	@Autowired
	private PersonService personService;

	@GET
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the list of all Respondants", response = Respondant.class, responseContainer = "List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Respondants found"),
	     @ApiResponse(code = 404, message = "Respondants not found")
	   })	
	public Iterable<Respondant> getAllRespondants() {
		return respondantService.getByAccountId(1l);
	}

	
	@GET
	@Path("/{uuid}")
	@ApiOperation(value = "Gets the Respondant for a given Uuid", response = Respondant.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Respondant found"),
	     @ApiResponse(code = 404, message = "Unable to associate this id with a respondant."),
	     @ApiResponse(code = 410, message = "This respondant has already completed assessment.")
	   })
	@Produces(MediaType.APPLICATION_JSON)
	public Response getRespondant(
			@Context final HttpServletRequest reqt,
			@ApiParam(value = "respondant uuid") @PathParam("uuid") @NotNull UUID uuid) {
		log.debug("Requested respondant respondant by uuid {}", uuid);
		
		Respondant respondant = respondantService.getRespondant(uuid);
		if (respondant != null) {
			if (respondant.getRespondantStatus() < Respondant.STATUS_STARTED) {
				respondant.setRespondantStatus(Respondant.STATUS_STARTED);
				respondant.setStartTime(new Timestamp(new Date().getTime()));
				respondant.setRespondantUserAgent(reqt.getHeader("User-Agent"));
				log.debug("Updating respondant {} status to STARTED", respondant);
				respondantService.save(respondant);
			} else if (respondant.getRespondantStatus() >= Respondant.STATUS_COMPLETED) {
				// TODO put in better error handling here.
				log.debug("Survey already completed for respondant {}", respondant);
				return Response.status(Status.GONE).entity(respondant).build();
			}
			log.debug("Returning respondant {}", respondant);
			return Response.status(Status.OK).entity(respondant).build();
		} else {
			// TODO put in better error handling here.
			log.debug("Respondant not found for uuid {}", uuid);
			return Response.status(Status.NOT_FOUND).build();
		}
	}	

	
	public Response saveRespondant(Respondant respondant) {
		log.debug("Requested respondant save: {}", respondant);
		
		Respondant savedRespondant = respondantService.save(respondant);
		log.debug("Saved respondant {}", savedRespondant);
		
		return Response.status(Status.CREATED).entity(savedRespondant).build();
	}

	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Creates a new respondant", response = Respondant.class)
	  @ApiResponses(value = {
      @ApiResponse(code = 201, message = "Respondant saved")})	
	public Response newRespondant(
			    @FormParam("email") String to, @FormParam("fname") String fname,
				@FormParam("lname") String lname, @FormParam("address") String address, 
				@FormParam("lat") Double personLat,
				@FormParam("lng") Double personLong, @FormParam("asid") Long asid,
				@FormParam("location_id") Long locationId, @FormParam("position_id") Long positionId) {

			// Validate input fields
			AccountSurvey as = accountSurveyService.getAccountSurveyById(asid);
			// Perform business logic
			Person applicant = new Person();
			applicant.setEmail(to);
			applicant.setFirstName(fname);
			applicant.setLastName(lname);
			applicant.setAddress(address);
			applicant.setLatitude(personLat);
			applicant.setLongitude(personLong);
			Person savedApplicant = personService.save(applicant);
			
			Respondant respondant = new Respondant();
			respondant.setPerson(savedApplicant);
			respondant.setAccountId(as.getAccountId());
			respondant.setAccountSurveyId(asid);
			respondant.setLocationId(locationId);// ok for null location
			respondant.setPositionId(positionId);// ok for null location

			Respondant savedRespondant = respondantService.save(respondant);
			
			return Response.status(Status.CREATED).entity(savedRespondant).build();
	}
		
		
	@GET
	@Path("/{uuid}/getsurvey")
	@ApiOperation(value = "Gets the assessment for a given Uuid", response = AccountSurvey.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Assessment found"),
	     @ApiResponse(code = 404, message = "Unable to associate this link with an assessment."),
	     @ApiResponse(code = 410, message = "This assessment has already been completed and submitted.")
	   })	
	@Produces(MediaType.APPLICATION_JSON)
	public Response getSurvey(@Context final HttpServletRequest reqt,
			@ApiParam(value = "respondant uuid") @PathParam("uuid") @NotNull UUID uuid) {

		log.debug("Requested survey by respondant uuid {}", uuid);
		
		Respondant respondant = respondantService.getRespondant(uuid);
		if (respondant != null) {
			if (respondant.getRespondantStatus() < Respondant.STATUS_STARTED) {
				respondant.setRespondantStatus(Respondant.STATUS_STARTED);
				respondant.setStartTime(new Timestamp(new Date().getTime()));
				respondant.setRespondantUserAgent(reqt.getHeader("User-Agent"));
			} else if (respondant.getRespondantStatus() >= Respondant.STATUS_COMPLETED) {
				// TODO put in better error handling here.
				log.debug("Survey already completed for respondant {}", respondant);
				return Response.status(Status.GONE).entity(respondant.getAccountSurvey()).build();
			}
			log.debug("Returning survey by respondant {}", respondant);
			return Response.status(Status.OK).entity(respondant.getAccountSurvey()).build();
		} else {
			// TODO put in better error handling here.
			log.debug("Respondant not found for uuid {}", uuid);
			return Response.status(Status.NOT_FOUND).build();
		}		
	}
	
	@PUT
	@Path("/{uuid}/submit")
	@ApiOperation(value = "Gets the assessment for a given Uuid", response = Respondant.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Assessment submitted"),
	     @ApiResponse(code = 304, message = "This assessment has already been completed and submitted."),
	     @ApiResponse(code = 404, message = "Unable to find respondant")
	   })	
	@Produces(MediaType.APPLICATION_JSON)
	public Response submitAssessment (
			@ApiParam(value = "respondant uuid") @PathParam("uuid") @NotNull UUID uuid) {
			log.debug("Survey Submitted for Respondant uuid {} " + uuid);

			Respondant respondant = respondantService.getRespondant(uuid);
			
			if (respondant == null) return Response.status(Status.NOT_FOUND).build();
			if (respondant.getRespondantStatus() < Respondant.STATUS_COMPLETED) {
				respondant.setRespondantStatus(Respondant.STATUS_COMPLETED);
				respondant.setFinishTime(new Timestamp(new Date().getTime()));
				respondantService.save(respondant);
//TODO Trigger scoring logic....	postScores(respondant);
				return Response.status(Status.ACCEPTED).entity(respondant).build();
			} else {
				return Response.status(Status.NOT_MODIFIED).entity(respondant).build();	
			}
		}	
}
