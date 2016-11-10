package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;
import java.util.Set;

import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;

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
import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.RespondantService;

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
public class AccountSurveyResource {
	private static final Logger log = LoggerFactory.getLogger(AccountSurveyResource.class);
	
	@Autowired
	private AccountSurveyService accountSurveyService;

	@Autowired
	private RespondantService respondantService;
		
	@GET
	@Path("/{asid}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets the survey by provided asId", response = AccountSurvey.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Survey found"),
	     @ApiResponse(code = 404, message = "No such Survey found")
	   })	
	public Response getSurvey(
			@ApiParam(value = "survey id") @PathParam("asid") @NotNull Long asid) {
		log.debug("Requested survey by id {}", asid);		
		AccountSurvey survey = accountSurveyService.getAccountSurveyById(asid);
		log.debug("Returning survey by id {} as {}", asid, survey);
		
		if(null != survey) {
			return Response.status(Status.OK).entity(survey).build();
		} else {
			return Response.status(Status.NOT_FOUND).entity("No such assessment found").build();
		}
	}	

	@GET
	@Path("/{asid}/respondantbypayroll/{id}")
	@ApiOperation(value = "Gets the respondant by asid and payroll id", response = Respondant.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Assessment found"),
	     @ApiResponse(code = 404, message = "Unable to find assessment for this id."),
	     @ApiResponse(code = 410, message = "This assessment has already been completed and submitted.")
	   })	
	@Produces(MediaType.APPLICATION_JSON)
	public Response getRespondantByPayrollId(
			@Context final HttpServletRequest reqt,
			@ApiParam(value = "survey id") @PathParam("asid") @NotNull Long asid,
			@ApiParam(value = "payroll id") @PathParam("id") @NotNull String payrollId) {

		log.debug("Returning respondant by asid {} and payroll id {}", asid, payrollId);
		
		AccountSurvey survey = accountSurveyService.getAccountSurveyById(asid);

		Respondant respondant = null;
		if (survey != null) {
			//Account account = survey.getAccount();
			respondant = respondantService.getRespondantById(Long.getLong(payrollId));// this wont actually work!
		}
		
		if (respondant != null) {
			if (respondant.getRespondantStatus() < Respondant.STATUS_STARTED) {
				respondant.setRespondantStatus(Respondant.STATUS_STARTED);
				respondant.setStartTime(new Timestamp(new Date().getTime()));
				respondant.setRespondantUserAgent(reqt.getHeader("User-Agent"));
				respondantService.save(respondant);
			} else if (respondant.getRespondantStatus() >= Respondant.STATUS_COMPLETED) {
				log.debug("Survey already completed for respondant {}", respondant);
				return Response.status(Status.GONE).entity(respondant.getAccountSurvey()).build();
			}
			
			log.debug("Returning respondant {}", respondant);
			return Response.status(Status.OK).entity(respondant.getAccountSurvey()).build();
		}

		log.debug("Respondant not found for payroll id {}", payrollId);
		return Response.status(Status.NOT_FOUND).entity("Unable to find assessment for this id.").build();

	}

}
