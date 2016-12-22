package com.talytica.survey.resources;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import javax.annotation.security.PermitAll;
import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Criterion;
import com.employmeo.data.model.Grade;
import com.employmeo.data.model.Grader;
import com.employmeo.data.service.GraderService;
import com.employmeo.data.service.RespondantService;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@PermitAll
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/grader")
@Api( value="/1/grader", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class GraderResource {
	@Autowired
	GraderService graderService;
	
	@Autowired
	RespondantService respondantService;

	@GET
	@Path("/{uuid}")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets grader based on uuid", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Grader found"),
	     @ApiResponse(code = 404, message = "Grader not found")
	   })
	public Response getGraderByUserId(@ApiParam(value = "user id") @PathParam("uuid") @NotNull UUID uuId) {
		log.debug("Requested grader by uuid {}", uuId);

		Grader grader = graderService.getGraderByUuid(uuId);
		if (null == grader) Response.status(Status.GONE).entity("Reference Request not found for this ID.").build();
		if (grader.getStatus() >= 10) return Response.status(Status.GONE).entity("This reference request has already been completed and submitted.").build();
		return Response.status(Status.OK).entity(grader).build();

	}

	@GET
	@Path("/{uuid}/grades")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets list of the grades for grader", response = Grade.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Grades found")
	   })
	public Response getGradesByGraderId(@ApiParam(value = "user id") @PathParam("uuid") @NotNull UUID uuId) {
		log.debug("Requested grades by grader uuid {}", uuId);
		Grader grader = graderService.getGraderByUuid(uuId);
		List<Grade> grades = graderService.getGradesByGraderId(grader.getId());
		return Response.status(Status.OK).entity(grades).build();

	}

	@GET
	@Path("/{uuid}/criteria")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Gets a list of the criteria (questions) for a grader", response = Criterion.class, responseContainer="List")
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Criteria found")
	   })
	public Response getCriteriaByGraderId(@ApiParam(value = "grader id") @PathParam("uuid") @NotNull UUID uuId) {
		Grader grader = graderService.getGraderByUuid(uuId);
		List<Criterion> criteria = graderService.getCriteriaListByQuestionId(grader.getQuestionId());
		log.debug("Found {} criteria for grader uuid {}", criteria.size(), uuId);
		return Response.status(Status.OK).entity(criteria).build();
	}


	@POST
	@Path("/grade")
	@Consumes(MediaType.APPLICATION_JSON)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Persists the provided grade", response = Grade.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 201, message = "Grade Saved"),
	   })
	public Response saveQuestion(@ApiParam(value = "grade") Grade grade) {
		log.debug("Requested grade save: {}", grade);

		Grade savedGrade = graderService.saveGrade(grade);
		log.debug("Saved grade {}", savedGrade);

		return Response.status(Status.CREATED).entity(savedGrade).build();
	}

	@POST
	@Path("/{uuid}/submit")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the status of specified grader", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Status update accepted"),
	   })
	public Response submitGrader(@ApiParam(value = "grader id") @PathParam("uuid") UUID uuId) {
		log.debug("Requested grader id: {} status update to {}", uuId, Grader.STATUS_COMPLETED);
		Grader grader = graderService.getGraderByUuid(uuId);
		if (grader != null) {
			grader.setStatus(Grader.STATUS_COMPLETED);
			Grader savedGrader = graderService.save(grader);
			log.debug("Saved grader {}", savedGrader);
			return Response.status(Status.CREATED).entity(savedGrader).build();
		} else {
			return Response.status(Status.NOT_FOUND).build();
		}
	}
	
	@GET
	@Path("/{uuid}/decline")
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "Updates the status of specified grader", response = Grader.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Status update accepted"),
	   })
	public Response declineGrader(@ApiParam(value = "grader id") @PathParam("uuid") UUID uuId) throws Exception {
		log.debug("Requested grader id: {} status update to {}", uuId, Grader.STATUS_IGNORED);
		Grader grader = graderService.getGraderByUuid(uuId);
		if (grader != null) {
			grader.setStatus(Grader.STATUS_IGNORED);
			Grader savedGrader = graderService.save(grader);
			log.debug("Declined grader {}", savedGrader);
		} 
		return Response.seeOther(new URI("/thankyou.htm")).build();
	}
}
