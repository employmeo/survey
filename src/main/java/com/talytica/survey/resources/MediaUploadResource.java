package com.talytica.survey.resources;

import java.io.InputStream;

import javax.annotation.security.PermitAll;
import javax.ws.rs.Consumes;
import javax.ws.rs.FormParam;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.glassfish.jersey.media.multipart.FormDataParam;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@PermitAll
@Consumes(MediaType.MULTIPART_FORM_DATA)
@Produces(MediaType.APPLICATION_JSON)
@Path("/1/upload")
@Api( value="/1/upload", produces=MediaType.APPLICATION_JSON, consumes=MediaType.MULTIPART_FORM_DATA)
public class MediaUploadResource {

	
	@POST
	@Path("/video")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
	@Produces(MediaType.APPLICATION_JSON)
	@ApiOperation(value = "upload video response", response = com.employmeo.data.model.Response.class)
	   @ApiResponses(value = {
	     @ApiResponse(code = 200, message = "Video Response Saved"),
	     @ApiResponse(code = 400, message = "Error saving video response")
	   })
	public Response saveVideo(
			@ApiParam(name="video", type="file")
			@RequestParam("video") MultipartFile video){
		
	    log.info(video.getName());
	    com.employmeo.data.model.Response answer = new com.employmeo.data.model.Response();
	  
	    return Response.status(Response.Status.ACCEPTED).entity(answer).build();
	}

}
