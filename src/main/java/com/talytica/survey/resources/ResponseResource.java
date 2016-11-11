package com.talytica.survey.resources;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Set;
import java.util.UUID;

import javax.annotation.security.PermitAll;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.Response;

import com.employmeo.data.service.RespondantService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
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
	
	@GET
	@Path("/{uuid}")
	@ApiOperation(value = "Gets the Respondant for a given Uuid", response = com.employmeo.data.model.Response.class)
	   @ApiResponses(value = {
			     @ApiResponse(code = 200, message = "Respondant found"),
			     @ApiResponse(code = 404, message = "Unable to associate this id with a respondant.")
	   })
	@Produces(MediaType.APPLICATION_JSON)
	public Response getResponses(
			@ApiParam(value = "respondant uuid") @PathParam("uuid") @NotNull UUID uuid) {
		log.trace("Requesting responses for respondat with uuid {}", uuid);
		Set <com.employmeo.data.model.Response> responses = respondantService.getResponses(uuid);
		return Response.status(Status.OK).entity(responses).build();

	}
	
	@POST
	@PermitAll
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Saves a response object from form submission", response = com.employmeo.data.model.Response.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Response Created")
	   })
	public Response saveResponse(@ApiParam(value = "response object") com.employmeo.data.model.Response response) {
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
	public Response updateResponse(@ApiParam(value = "response object") com.employmeo.data.model.Response response) {
		log.trace("Processing response {}", response);
		respondantService.saveResponse(response);
		return Response.status(Status.CREATED).entity(response).build();
	}
}