package com.talytica.survey.resources;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Person;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.RespondantService;
import com.employmeo.data.service.SurveyService;

import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import org.json.JSONObject;


@Path("order")
public class NewAssessment {
	private static final Logger log = LoggerFactory.getLogger(NewAssessment.class);

	@Autowired
	private SurveyService surveyService;
	
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	public String doPost(@FormParam("email") String to, @FormParam("fname") String fname,
			@FormParam("lname") String lname, @FormParam("address") String address, @FormParam("lat") Double personLat,
			@FormParam("lng") Double personLong, @FormParam("asid") Long asid,
			@FormParam("location_id") Long locationId, @FormParam("position_id") Long positionId) {

		// Validate input fields
		AccountSurvey as = new AccountSurvey();//surveyService.getSurveyById(asid)
		// Perform business logic
		Person applicant = new Person();
		applicant.setEmail(to);
		applicant.setFirstName(fname);
		applicant.setLastName(lname);
		applicant.setAddress(address);
		applicant.setLatitude(personLat);
		applicant.setLongitude(personLong);

		Respondant respondant = new Respondant();
		respondant.setPerson(applicant);
		respondant.setAccountId(as.getAccountId());
		respondant.setAccountSurveyId(asid);
		respondant.setLocationId(locationId);// ok for null location
		respondant.setPositionId(positionId);// ok for null location


		JSONObject json = new JSONObject();
//		json.put("person", applicant.getJSON());
//		json.put("respondant", respondant.getJSON());
//		json.put("survey", as.getJSON());

		log.debug(json.toString());
		return json.toString();
	}

}