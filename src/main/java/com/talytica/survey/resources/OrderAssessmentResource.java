package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;

import javax.annotation.security.PermitAll;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.RespondantService;
import com.talytica.survey.objects.OrderAssessment;

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
@Path("/1/orderassessment")
@Api( value="/1/orderassessment", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class OrderAssessmentResource {
	private static final Long TOPPERFORMERTARGET = 4l; // for now.
	private static final Long GETSHIREDTARGET = 1l; // for now.

	@Autowired
	private PersonService personService;
	@Autowired
	private AccountSurveyService accountSurveyService;
	@Autowired
	private RespondantService respondantService;
	
	@POST
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Creates a new respondant for a specified assessment", response = Respondant.class)
	  @ApiResponses(value = {
      @ApiResponse(code = 201, message = "Respondant saved")})	
	public Response newRespondant(
				@Context final HttpServletRequest reqt,
			    @ApiParam("Assessment Order") OrderAssessment order) {

		log.debug("New respondant orderd with {}", order);
		// Validate input fields
		AccountSurvey as = accountSurveyService.getAccountSurveyById(order.asid);
		// Perform business logic
		Person applicant = new Person();
		applicant.setEmail(order.email);
		applicant.setFirstName(order.fname);
		applicant.setLastName(order.lname);
		applicant.setAddress(order.address);
		applicant.setLatitude(order.lat);
		applicant.setLongitude(order.lng);
		Person savedApplicant = personService.save(applicant);
		
		Respondant respondant = new Respondant();
		respondant.setPerson(savedApplicant);
		respondant.setPersonId(savedApplicant.getId());
		respondant.setAccountId(as.getAccountId());
		respondant.setAccountSurveyId(order.asid);

		respondant.setLocationId(as.getAccount().getDefaultLocationId());
		if (order.locationId != null) respondant.setLocationId(order.locationId);
		respondant.setPositionId(as.getAccount().getDefaultPositionId());
		if (order.positionId != null) respondant.setPositionId(order.positionId);
		
		respondant.setRespondantStatus(Respondant.STATUS_STARTED);
		respondant.setStartTime(new Timestamp(new Date().getTime()));
		respondant.setRespondantUserAgent(reqt.getHeader("User-Agent"));
		
		if (as.getBenchmarkId() != null) respondant.setBenchmarkId(as.getBenchmarkId());
		if (order.type != null) respondant.setType(order.type);
		
		Respondant savedRespondant = respondantService.save(respondant);
		
		if (respondant.getType() == Respondant.TYPE_BENCHMARK) {
			respondantService.addOutcomeToRespondant(savedRespondant, GETSHIREDTARGET, true);
			if (order.topPerformer) respondantService.addOutcomeToRespondant(savedRespondant, TOPPERFORMERTARGET, true);
		}
		
		return Response.status(Status.CREATED).entity(savedRespondant).build();
	}		
}

