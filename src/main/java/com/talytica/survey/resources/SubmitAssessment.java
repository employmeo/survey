package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import javax.annotation.security.PermitAll;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;


import com.employmeo.data.model.Partner;
import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.RespondantService;


@Path("submitassessment")
public class SubmitAssessment {
	private static final ExecutorService TASK_EXECUTOR = Executors.newCachedThreadPool();
	private static final Logger log = LoggerFactory.getLogger(SubmitAssessment.class);

	@Autowired
	private RespondantService respondantService;
	
	@PermitAll
	@POST
	@Produces(MediaType.APPLICATION_JSON)
	public Respondant doPost(
			// @FormParam("finish_time") TimeStamp finishTime,
			@FormParam("respondant_id") Long respondantId) {
		log.debug("Survey Submitted for Respondant: " + respondantId);

		Respondant respondant = respondantService.getRespondantById(respondantId);
		if (respondant.getRespondantStatus() < Respondant.STATUS_COMPLETED) {
			respondant.setRespondantStatus(Respondant.STATUS_COMPLETED);
			respondant.setFinishTime(new Timestamp(new Date().getTime()));

		}

		postScores(respondant);

		return respondant;
	}

	private static void postScores(Respondant respondant) {
		TASK_EXECUTOR.submit(new Runnable() {
			@Override
			public void run() {
				
				// Check if integrated:
				Partner partner = respondant.getPartner();
				if (partner != null) {
//					PartnerUtil pu = partner.getPartnerUtil();
//					JSONObject message = pu.getScoresMessage(respondant);
//					pu.postScoresToPartner(respondant, message);
				} else {
//					respondant.getAssessmentScore();
//					PredictionUtil.predictRespondant(respondant);
				}

//				if (respondant.getRespondantEmailRecipient() != null
//						&& !respondant.getRespondantEmailRecipient().isEmpty()) {
//					EmailUtility.sendResults(respondant);
//				}
			}
		});
	}
}