package com.talytica.survey.resources;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

import com.employmeo.data.model.Response;
import com.employmeo.data.service.RespondantService;


import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@Path("/1/response")
@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
@Produces(MediaType.APPLICATION_JSON)
@Api( value="/1/response", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_FORM_URLENCODED)
public class ResponseResource {
	@Autowired
	private RespondantService respondantService;
	
	private static final Logger log = LoggerFactory.getLogger(ResponseResource.class);
	
	@POST
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Saves a response object from form submission", response = Response.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Response Created")
	   })
	public Response doPost(
			@FormParam("response_respondant_id") Long respondantId, 
			@FormParam("response_question_id") Long questionId,
			@FormParam("response_value") int responseVal, 
			@FormParam("response_text") String responseText) {

		log.trace("Processing Respondant: " + respondantId + " Question: " + questionId);
		
		Response response = new Response();
		response.setRespondantId(respondantId);
		response.setQuestionId(questionId);
		response.setResponseValue(responseVal);
		response.setResponseText(responseText);

		respondantService.saveResponse(response);
		return response;
	}

	@PUT
	@Consumes(MediaType.APPLICATION_FORM_URLENCODED)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates a response object from form submission", response = Response.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Response Updated"),
	     @ApiResponse(code = 404, message = "Response not found")
	   })
	public Response doPut(@FormParam("response_id") Long responseId,
			@FormParam("response_respondant_id") Long respondantId,
			@FormParam("response_question_id") Long questionId,
			@FormParam("response_value") int responseVal,
			@FormParam("response_text") String responseText) {

		log.trace("Processing Respondant: " + respondantId + " Question: " + questionId);
		
		Response response = new Response();
		response.setRespondantId(respondantId);
		response.setQuestionId(questionId);
		response.setResponseValue(responseVal);
		response.setResponseText(responseText);
		response.setId(responseId);
			
		respondantService.saveResponse(response);
		return response;
	}
}