package com.talytica.survey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.web.MultipartAutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.web.multipart.commons.CommonsMultipartResolver;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3Client;;

@SpringBootApplication(
		exclude={MultipartAutoConfiguration.class},
		scanBasePackages = {"com.employmeo.data", "com.talytica.survey", "com.talytica.common", "com.talytica.metrics"}
		)
public class SurveyApplication {

	public static void main(String[] args) {
		SpringApplication.run(SurveyApplication.class, args);
	}
	
	@Bean
	public CommonsMultipartResolver multipartResolver() {
		CommonsMultipartResolver resolver = new CommonsMultipartResolver();
	    resolver.setMaxUploadSizePerFile(15000000); //bytes
	    return resolver;
	}
	

}
