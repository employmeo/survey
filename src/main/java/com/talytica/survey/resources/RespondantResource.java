package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;
import java.util.UUID;

import javax.annotation.security.PermitAll;
import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.RespondantService;
import com.talytica.survey.objects.FountainRequest;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.extern.slf4j.Slf4j;

@Component
@PermitAll
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Slf4j
@Path("/1/respondant")
@Api( value="/1/respondant", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class RespondantResource {

	@Autowired
	private RespondantService respondantService;
	@Autowired
	private AccountSurveyService accountSurveyService;
	
	@Value("FN")
	String FOUNTAINPREFIX;
	
	@Value("https://fountain.com")
	String FOUNTAINSITE;
	
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
				respondant.setIpAddress(reqt.getRemoteAddr());
				log.debug("Updating respondant {} status to STARTED", respondant);
				respondantService.save(respondant);
			} else if ((respondant.getRespondantStatus() >= Respondant.STATUS_ADVANCED) && 
					(respondant.getRespondantStatus() < Respondant.STATUS_ADVCOMPLETED)) {
				respondant.setRespondantStatus(Respondant.STATUS_ADVSTARTED);
				log.debug("Respondant {} started 2nd stage assessment", respondant.getId());
				respondantService.save(respondant);
				
			} else if ((respondant.getRespondantStatus() >= Respondant.STATUS_COMPLETED) ||
					((respondant.getRespondantStatus() >= Respondant.STATUS_ADVCOMPLETED))) {
				return completedResponse(respondant);
			}
			log.debug("Returning respondant {}", respondant);
			return Response.status(Status.OK).entity(respondant).build();
		} else {
			// TODO put in better error handling here.
			log.debug("Respondant not found for uuid {}", uuid);
			return Response.status(Status.NOT_FOUND).entity("Unable to associate this link with an assessment.").build();
		}
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
	public Response getSurvey(@ApiParam(value = "respondant uuid") @PathParam("uuid") @NotNull UUID uuid) {

		log.debug("Requested survey by respondant uuid {}", uuid);
		AccountSurvey as = null;
		Respondant respondant = respondantService.getRespondant(uuid);
		if (respondant != null) {
			if (respondant.getRespondantStatus() < Respondant.STATUS_COMPLETED) {
				as = respondant.getAccountSurvey();
			} else if ((respondant.getRespondantStatus() >= Respondant.STATUS_ADVANCED) && 
				(respondant.getRespondantStatus() < Respondant.STATUS_ADVCOMPLETED)) {
				log.debug("Respondant {} started 2nd stage assessment", respondant.getId());
				as = accountSurveyService.getAccountSurveyById(respondant.getSecondStageSurveyId());
			} else if ((respondant.getRespondantStatus() >= Respondant.STATUS_COMPLETED) ||
					((respondant.getRespondantStatus() >= Respondant.STATUS_ADVCOMPLETED))) {
				return completedResponse(respondant);
			}
		}
		if (null != as) {
			log.debug("Returning survey by respondant {}", respondant);
			return Response.status(Status.OK).entity(as).build();
		} else {
			// TODO put in better error handling here.
			log.debug("Respondant not found for uuid {}", uuid);
			return Response.status(Status.NOT_FOUND).entity("Unable to associate this link with an assessment.").build();
		}		
	}
		
	@POST
	@PermitAll
	@Consumes(MediaType.APPLICATION_JSON)
	@Path("/fountain")
	@ApiOperation(value = "Gets the Respondant using fountain advance link", response = Respondant.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Respondant found"),
	     @ApiResponse(code = 404, message = "Unable to associate this id with a respondant."),
	     @ApiResponse(code = 410, message = "This respondant has already completed assessment.")
	   })
	@Produces(MediaType.APPLICATION_JSON)
	public Response getFountainRespondant(
			@Context final HttpServletRequest reqt,
			@ApiParam("Fountain Object") FountainRequest fReq) {
		log.info("Requested respondant respondant by fountain request {}", fReq);
		
		Respondant respondant = respondantService.getRespondantByAtsId(FOUNTAINPREFIX + fReq.fountainId);
		if (respondant != null) {
			if (respondant.getRespondantStatus() < Respondant.STATUS_STARTED) {
				respondant.setRespondantStatus(Respondant.STATUS_STARTED);
				respondant.setStartTime(new Timestamp(new Date().getTime()));
				respondant.setRespondantUserAgent(reqt.getHeader("User-Agent"));
				respondant.setIpAddress(reqt.getRemoteAddr());
				respondant.setRedirectUrl(FOUNTAINSITE + fReq.redirectUrl);
				log.debug("Updating respondant {} status to STARTED", respondant);
				respondantService.save(respondant);
			} else if ((respondant.getRespondantStatus() >= Respondant.STATUS_ADVANCED) && 
					(respondant.getRespondantStatus() < Respondant.STATUS_ADVCOMPLETED)) {
				respondant.setRespondantStatus(Respondant.STATUS_ADVSTARTED);
				respondant.setRedirectUrl(FOUNTAINSITE + fReq.redirectUrl);
				log.debug("Respondant {} started 2nd stage assessment", respondant.getId());
				respondantService.save(respondant);
				
			} else if ((respondant.getRespondantStatus() >= Respondant.STATUS_COMPLETED) ||
					((respondant.getRespondantStatus() >= Respondant.STATUS_ADVCOMPLETED))) {
				return completedResponse(respondant);
			}
			log.debug("Returning respondant {}", respondant);
			return Response.status(Status.OK).entity(respondant).build();
		} else {
			// TODO put in better error handling here.
			log.debug("Respondant not found for fountain {}", fReq.fountainId);
			return Response.status(Status.NOT_FOUND).entity("Unable to associate this link with an assessment.").build();
		}
	}

	private Response completedResponse(Respondant respondant) {
		log.debug("Survey already completed for respondant {}", respondant);
		
		String nextPage = respondant.getAccountSurvey().getRedirectPage();
		if (null != respondant.getRedirectUrl()) nextPage = respondant.getRedirectUrl(); 
		if (nextPage == null) return Response.status(Status.GONE).entity("This assessment has already been completed and submitted.").build();

		return Response.status(Status.GONE)
				.entity("This assessment has already been completed and submitted.")
				.header("redirect", nextPage)
				.build();
	}
	
}