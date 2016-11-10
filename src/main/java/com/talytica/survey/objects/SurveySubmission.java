package com.talytica.survey.objects;

import java.util.UUID;

public class SurveySubmission {

	public UUID uuid;
	
	public SurveySubmission() {
		this.uuid = null;
	}

	public SurveySubmission(UUID uuid) {
		this.uuid = uuid;
	}
	
}
