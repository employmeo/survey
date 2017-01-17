package com.talytica.survey;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.util.StopWatch;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Aspect
@Component
public class MetricAspect {

    private final MetricSender metricSender;

    @Autowired
    public MetricAspect(MetricSender metricSender) {
        this.metricSender = metricSender;
    }

    @Around("bean(*Resource)")
    public Object doBasicProfiling(ProceedingJoinPoint pjp) throws Throwable {
    	log.trace("Beginning profiling..");
        StopWatch stopWatch = metricSender.getStartedStopWatch();

        try {
            return pjp.proceed();
        } finally {
        	recordMetric(pjp, stopWatch);
        }
    }

	private void recordMetric(ProceedingJoinPoint pjp, StopWatch stopWatch) {
		Class<?> clazz = pjp.getTarget().getClass();
		MethodSignature methodSignature = (MethodSignature) pjp.getSignature();
		String methodName = methodSignature.getName();
		metricSender.stopAndSend(stopWatch, clazz, methodName);

		log.trace("Finished profiling {} : {}", clazz, methodName);
	}
}


