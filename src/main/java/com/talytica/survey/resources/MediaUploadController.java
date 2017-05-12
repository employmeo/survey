package com.talytica.survey.resources;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.Instant;

import javax.ws.rs.core.MediaType;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.employmeo.data.service.RespondantService;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.CannedAccessControlList;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.employmeo.data.model.Response;

import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.annotations.ApiResponse;
import io.swagger.annotations.ApiResponses;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Controller
@RequestMapping("/upload")
public class MediaUploadController {

    @Autowired
    private AmazonS3Client s3Client;
	
	@Autowired
	RespondantService respondantService;

	@Value("${com.talytica.media.s3bucket}")
	private String s3BucketName;
	
	@PostMapping(path = "/media", consumes = MediaType.MULTIPART_FORM_DATA, produces = MediaType.APPLICATION_JSON)
	@ApiOperation(value = "upload media response", response = Response.class)
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Media Response Saved"),
			@ApiResponse(code = 400, message = "Error saving media response") })
	public @ResponseBody javax.ws.rs.core.Response fileUpload(
			@ApiParam(name="media", value="media file", type="file") @RequestParam("media") MultipartFile media, 
			@ApiParam(name="id", value="response id", required=false) @RequestParam("id") Long responseId,
			@ApiParam(name="respondantId") @RequestParam("respondantId") Long respondantId,
			@ApiParam(name="questionId") @RequestParam("questionId") Long questionId
			) throws IOException {
		
		if (null == media) return javax.ws.rs.core.Response.status(javax.ws.rs.core.Response.Status.NO_CONTENT).build(); // No file provided!
		
		log.debug("Received file: {} for respondant: {}, question: {}", media.getOriginalFilename(), respondantId, questionId);
		Response answer = new Response();		
		answer.setQuestionId(questionId);
		answer.setRespondantId(respondantId);
		
        String key = "clientmedia/" + Instant.now().getEpochSecond() + "_" + media.getOriginalFilename();
        String url = "https://s3.amazonaws.com/" + s3BucketName + "/" + key;
        answer.setResponseMedia(url);
        
		try {	
            s3Client.putObject(new PutObjectRequest(s3BucketName, key, convertMultipart(media))
            			.withCannedAcl(CannedAccessControlList.PublicRead));
		} catch (Exception e) {
			log.error("Failed to save file: {} to url: {}", media.getName());
			return javax.ws.rs.core.Response.status(javax.ws.rs.core.Response.Status.INTERNAL_SERVER_ERROR).build();
		}
		if (null != respondantId && respondantId > 0) answer.setRespondantId(respondantId);
		
		Response saved = respondantService.saveResponse(answer);
		return javax.ws.rs.core.Response.status(javax.ws.rs.core.Response.Status.ACCEPTED).entity(saved).build();
	}
	
	private File convertMultipart(MultipartFile media) throws IOException {
		File convFile = new File(media.getOriginalFilename());
	    convFile.createNewFile(); 
	    FileOutputStream fos = new FileOutputStream(convFile); 
	    fos.write(media.getBytes());
	    fos.close();
	    return convFile;
	}

}