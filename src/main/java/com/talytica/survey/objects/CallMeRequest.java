package com.talytica.survey.objects;

import java.util.UUID;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;


@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class CallMeRequest {

	public UUID uuid;
	public String phoneNumber;

}
