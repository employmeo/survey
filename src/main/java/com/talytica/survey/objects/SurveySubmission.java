package com.talytica.survey.objects;

import java.util.UUID;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class SurveySubmission {

	public UUID uuid;
	
	public SurveySubmission(UUID uuid) {
		this.uuid = uuid;
	}
	
}
