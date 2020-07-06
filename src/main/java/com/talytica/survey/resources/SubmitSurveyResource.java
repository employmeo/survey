package com.talytica.survey.resources;

import java.sql.Timestamp;
import java.util.Date;

import javax.annotation.security.PermitAll;

import javax.validation.constraints.NotNull;
import javax.ws.rs.Consumes;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.employmeo.data.model.Respondant;
import com.employmeo.data.service.RespondantService;
import com.talytica.common.service.ServerAdminService;
import com.talytica.survey.objects.SurveySubmission;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;

@Component
@PermitAll
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/submitsurvey")
@Api( value="/1/submitsurvey", produces=MediaType.APPLICATION_JSON, consumes=MediaType.APPLICATION_JSON)
public class SubmitSurveyResource {
	private static final Logger log = LoggerFactory.getLogger(SubmitSurveyResource.class);

	@Autowired
	private RespondantService respondantService;

	@Autowired
	private ServerAdminService serverAdminService;
	
	@POST
	@ApiOperation(value = "Gets the assessment for a given Uuid")
	   @ApiResponses(value = {
	     @ApiResponse(code = 202, message = "Assessment submitted"),
	     @ApiResponse(code = 304, message = "This assessment has already been completed and submitted."),
	     @ApiResponse(code = 404, message = "Unable to find respondant")
	   })
	@Produces(MediaType.APPLICATION_JSON)
	public Response submitAssessment (
			@ApiParam(value = "survey submission") @NotNull SurveySubmission submission) {
			log.debug("Survey Submitted for Respondant uuid {} ", submission);

			Respondant respondant = respondantService.getRespondant(submission.uuid);
			
			if (respondant == null) return Response.status(Status.NOT_FOUND).build();
			if (respondant.getRespondantStatus() < Respondant.STATUS_COMPLETED) {
				respondant.setRespondantStatus(Respondant.STATUS_COMPLETED);
				respondant.setFinishTime(new Timestamp(new Date().getTime()));
				respondantService.save(respondant);
				log.info("Account: {} SURVEY COMPLETE for respondant id: {}",
						respondant.getAccount().getAccountName(),
						respondant.getId());
				// serverAdminService.triggerPipeline("scoring");
				return Response.status(Status.ACCEPTED).build();
			} else if ((respondant.getRespondantStatus() >= Respondant.STATUS_ADVANCED) && 
					(respondant.getRespondantStatus() < Respondant.STATUS_ADVCOMPLETED)) {
				respondant.setRespondantStatus(Respondant.STATUS_ADVCOMPLETED);
				respondantService.save(respondant);
				// serverAdminService.triggerPipeline("scoring");
				return Response.status(Status.ACCEPTED).build();
			} else {
				return Response.status(Status.NOT_MODIFIED).build();	
			}
		}	
}
