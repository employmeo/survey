package com.talytica.survey.objects;

import java.sql.Timestamp;
import java.util.Date;
import java.util.UUID;

public class SurveySubmission {

	public UUID uuid;
	public Timestamp finish;
	
	public SurveySubmission() {
		this.uuid = null;
		this.finish = new Timestamp(new Date().getTime());
	}

	public SurveySubmission(UUID uuid) {
		this.uuid = uuid;
		this.finish = new Timestamp(new Date().getTime());
	}
	
}
