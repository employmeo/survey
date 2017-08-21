package com.talytica.survey.resources;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.service.AccountSurveyService;
import com.employmeo.data.service.CorefactorService;
import com.employmeo.data.service.QuestionService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.core.Response;


@Component
@Path("/clearcache")
@Api( value="/clearcache")
public class ClearCacheResource {
	
	@Autowired
	QuestionService questionService;

	@Autowired
	CorefactorService corefactorService;
	
	@Autowired
	AccountSurveyService accountSurveyService;
	
	private static final Logger log = LoggerFactory.getLogger(ClearCacheResource.class);

	@POST
	@ApiOperation(value = "Clears System Caches", response = String.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "OK - Cache Cleared"),
	   })
	public Response doPost(String body) {
		log.debug("Cache clear called: {}");
		questionService.clearCache();
		corefactorService.clearCache();
		accountSurveyService.clearCache();
		return Response.status(Response.Status.OK).build();
	}

}