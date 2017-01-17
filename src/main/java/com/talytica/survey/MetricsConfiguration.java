package com.talytica.survey;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.codahale.metrics.JmxReporter;
import com.codahale.metrics.MetricRegistry;
import com.talytica.metrics.MetricSender;

import lombok.extern.slf4j.Slf4j;
@Slf4j
@Configuration
public class MetricsConfiguration {
	   @Autowired
	    private MetricRegistry metricRegistry;

	    @Bean
	    public MetricSender metricSender() {
	        return new MetricSender(metricRegistry);
	    }

	    @PostConstruct
	    public void connectRegistryToJmx() {
	        JmxReporter reporter = JmxReporter.forRegistry(metricRegistry).build();
	        reporter.start();
	        
	        log.info("Metrics configuration initialized, registry connected to Jmx");
	    }
}
