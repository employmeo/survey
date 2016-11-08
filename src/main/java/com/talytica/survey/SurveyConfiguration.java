package com.talytica.survey;

import javax.annotation.PostConstruct;
import javax.ws.rs.ApplicationPath;

import org.glassfish.jersey.server.ResourceConfig;
import org.glassfish.jersey.server.filter.RolesAllowedDynamicFeature;
import org.glassfish.jersey.server.wadl.internal.WadlResource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.swagger.jaxrs.config.BeanConfig;
import io.swagger.jaxrs.listing.ApiListingResource;
import io.swagger.jaxrs.listing.SwaggerSerializers;


@Component
@ApplicationPath("${spring.jersey.application-path:/survey}")
public class SurveyConfiguration extends ResourceConfig {
	private static final Logger log = LoggerFactory.getLogger(SurveyConfiguration.class);

	 @Value("${spring.jersey.application-path:/survey}")
	 private String apiPath;
	 
	public SurveyConfiguration() {
        registerEndpoints();
		//register(IntegrationAuthProvider.class);     
        register(RolesAllowedDynamicFeature.class);
	}
	
	@PostConstruct
    public void init() {
		log.info("Initializing swagger");
        configureSwagger();
        log.info("Swagger initialized");
    }	

	private void registerEndpoints() {

		packages("com.talytica.survey.resources");
		
		register(WadlResource.class);
	}

	
	private void configureSwagger() {
	     this.register(ApiListingResource.class);
	     this.register(SwaggerSerializers.class);

	     BeanConfig config = new BeanConfig();
	     config.setConfigId("com.talytica.services");
	     config.setTitle("Talytica Survey APIs");
	     config.setVersion("v1");
	     config.setContact("info@talytica.com");
	     config.setSchemes(new String[] { "http", "https" });
	     config.setBasePath(apiPath);
	     config.setResourcePackage("com.talytica.survey.resources");
	     config.setPrettyPrint(true);
	     config.setScan(true);
	   }
}
