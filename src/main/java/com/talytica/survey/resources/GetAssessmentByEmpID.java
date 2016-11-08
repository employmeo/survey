package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.employmeo.data.model.Account;
import com.employmeo.data.model.AccountSurvey;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.model.Response;
import com.employmeo.data.service.AccountService;
import com.employmeo.data.service.RespondantService;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;

import org.json.JSONObject;

@Path("getbypayrollid")
public class GetAssessmentByEmpID {
	private static final Logger log = LoggerFactory.getLogger(GetAssessmentByEmpID.class);
	
	@Autowired
	private RespondantService respondantService;
	
	@Autowired
	private AccountService accountService;
	
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	public String doPost(@Context final HttpServletRequest reqt,
			@FormParam("payroll_id") String payrollId,
			@FormParam("account_id") Long accountId) {

		log.debug("processing with: " + payrollId);
		
		JSONObject json = new JSONObject();
		Account account = accountService.getAccountById(accountId);
		Respondant respondant = respondantService.getRespondantById(Long.getLong(payrollId));// this wont actually work!

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
			json.put("message", "Unable to associate this ID with an assessment.");
		}

		return json.toString();
	}

}