package com.talytica.metrics;

import java.util.Map;
import java.util.SortedMap;
import java.util.TreeMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.endpoint.AbstractEndpoint;
import org.springframework.boot.actuate.endpoint.MetricsEndpoint;
import org.springframework.stereotype.Component;

@Component
public class MetricsPresentation extends AbstractEndpoint<Map<String, Object>> {
	@Autowired
	private MetricsEndpoint metricsEndpoint;
    
    public MetricsPresentation() {
        super("metrics-pretty");
    }

    @Override
    public Map<String, Object> invoke() {
        SortedMap<String, Object> metricsMap = new TreeMap<String, Object>(this.metricsEndpoint.invoke());
        return metricsMap;
    }
}
