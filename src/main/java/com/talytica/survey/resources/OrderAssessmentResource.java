package com.talytica.survey.resources;

import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.PersonService;
import com.employmeo.data.service.RespondantService;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

public class OrderAssessmentResource {
	
	@Autowired
	private PersonService personService;
	@Autowired
	private AccountSurveyService accountSurveyService;
	@Autowired
	private RespondantService respondantService;
	
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
		
}

