package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.json.JSONObject;

import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.Response;
import com.employmeo.data.service.RespondantService;

@Path("getsurvey")
public class GetSurvey {

	private static final Logger log = LoggerFactory.getLogger(GetSurvey.class);
	@Autowired
	private RespondantService respondantService;
	
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	public String doPost(
			// @FormParam("start_time") TimeStamp startTime,
			@Context final HttpServletRequest reqt,
			@FormParam("respondant_uuid") UUID respondantUuid) {

		log.debug("processing with: " + respondantUuid);
		
		JSONObject json = new JSONObject();
		Respondant respondant = respondantService.getRespondantById(1l);//respondantUuid);

		if (respondant != null) {
			if (respondant.getRespondantStatus() < Respondant.STATUS_STARTED) {
				respondant.setRespondantStatus(Respondant.STATUS_STARTED);
				respondant.setStartTime(new Timestamp(new Date().getTime()));
				respondant.setRespondantUserAgent(reqt.getHeader("User-Agent"));
			} else if (respondant.getRespondantStatus() >= Respondant.STATUS_COMPLETED) {
				// TODO put in better error handling here.
				json.put("message", "This assessment has already been completed and submitted");
			}

			AccountSurvey aSurvey = respondant.getAccountSurvey();
			json.put("survey", aSurvey);
			json.put("respondant", respondant);
			Set<Response> responses = respondant.getResponses();
			for (Response response : responses)
				json.accumulate("responses", response);
		} else {
			// TODO put in better error handling here.
			json.put("message", "Unable to associate this link with an assessment.");
		}

		return json.toString();
	}

}