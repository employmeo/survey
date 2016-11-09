package com.talytica.survey.resources;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import javax.annotation.security.PermitAll;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.Response;

import com.employmeo.data.service.RespondantService;


import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@PermitAll
@Path("/1/response")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Api( value="/1/response", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class ResponseResource {
	@Autowired
	private RespondantService respondantService;
	
	private static final Logger log = LoggerFactory.getLogger(ResponseResource.class);
	
	@POST
	@PermitAll
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Saves a response object from form submission", response = com.employmeo.data.model.Response.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Response Created")
	   })
	public Response saveResponse(com.employmeo.data.model.Response response) {
		log.trace("Processing response {}", response);
		respondantService.saveResponse(response);
		
		return Response.status(Status.CREATED).entity(response).build();

	}

	@PUT
	@PermitAll
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates a response object from form submission", response = com.employmeo.data.model.Response.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Response Updated"),
	     @ApiResponse(code = 404, message = "Response not found")
	   })
	public Response updateResponse(com.employmeo.data.model.Response response) {
		log.trace("Processing response {}", response);
		respondantService.saveResponse(response);
		return Response.status(Status.CREATED).entity(response).build();
	}
}