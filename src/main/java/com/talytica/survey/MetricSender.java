package com.talytica.survey;

import java.util.Map;

import org.springframework.util.StopWatch;

import com.codahale.metrics.ExponentiallyDecayingReservoir;
import com.codahale.metrics.Histogram;
import com.codahale.metrics.MetricRegistry;
import com.codahale.metrics.Reservoir;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class MetricSender {
    private final MetricRegistry registry;

    public MetricSender(MetricRegistry registry) {
        this.registry = registry;

    }

    private Histogram getOrAdd(String metricsName) {
        Map<String, Histogram> registeredHistograms = registry.getHistograms();
        Histogram registeredHistogram = registeredHistograms.get(metricsName);
        if (registeredHistogram == null) {
            Reservoir reservoir = new ExponentiallyDecayingReservoir();
            registeredHistogram = new Histogram(reservoir);
            log.debug("Registering histogram for metric: {}", metricsName);
            registry.register(metricsName, registeredHistogram);
        }
        return registeredHistogram;
    }

    public StopWatch getStartedStopWatch() {
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        return stopWatch;
    }

    private String computeMetricName(Class<?> clazz, String methodName) {
        return clazz.getName() + '.' + methodName;
    }

    public void stopAndSend(StopWatch stopWatch, Class<?> clazz, String methodName) {
        stopWatch.stop();
        String metricName = computeMetricName(clazz, methodName);
        getOrAdd(metricName).update(stopWatch.getTotalTimeMillis());
    }

}
