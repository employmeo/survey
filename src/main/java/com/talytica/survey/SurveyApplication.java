package com.talytica.survey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;;

@SpringBootApplication(scanBasePackages = {"com.employmeo.data", "com.talytica.survey", "com.talytica.common", "com.talytica.metrics"})
public class SurveyApplication {

	public static void main(String[] args) {
		SpringApplication.run(SurveyApplication.class, args);
	}
}
