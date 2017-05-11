package com.talytica.survey.resources;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URL;
import java.time.Instant;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;

import org.joda.time.DateTime;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.employmeo.data.service.RespondantService;
import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.AmazonS3Client;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.PutObjectRequest;
import com.employmeo.data.model.Response;

import io.swagger.annotations.ApiOperation;
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

	@Value("${com.talytica.media.files.s3bucket}")
	private String s3BucketName;
	
	@PostMapping(path = "/media", consumes = MediaType.MULTIPART_FORM_DATA, produces = MediaType.APPLICATION_JSON)
	@ApiOperation(value = "upload media response", response = com.employmeo.data.model.Response.class)
	@ApiResponses(value = { @ApiResponse(code = 200, message = "Media Response Saved"),
			@ApiResponse(code = 400, message = "Error saving media response") })
	public Response fileUpload(@RequestParam("media") MultipartFile media, @RequestParam("response") Response response) throws IOException {
		
		if (null == media) return response; // No file provided!
		
		log.debug("Received: {} with file {}",response, media.getName());
		Response answer = new Response();
		try {
		    File convFile = convertMultipart(media);
			log.debug("Converted to file {}",convFile);			
            String key = Instant.now().getEpochSecond() + "_" + convFile.getName();
            /* save file */
            s3Client.putObject(new PutObjectRequest(s3BucketName, key, convFile));

            /* get signed URL (valid for one year) */
            GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(s3BucketName, key);
            generatePresignedUrlRequest.setMethod(HttpMethod.GET);
            generatePresignedUrlRequest.setExpiration(DateTime.now().plusYears(1).toDate());

            URL signedUrl = s3Client.generatePresignedUrl(generatePresignedUrlRequest); 
            answer.setResponseMedia(signedUrl.toExternalForm());
			log.debug("Saved to Amazon S3");
		} catch (Exception e) {
			log.error("Failed to save file: ", media.getName());
			throw new WebApplicationException(e);
		}
		
		return answer;

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