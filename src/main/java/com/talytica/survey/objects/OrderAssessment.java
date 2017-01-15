package com.talytica.survey.objects;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class OrderAssessment {
  public Long asid;
  public String atsId;
  public String payrollId;
  public String email;
  public String fname;
  public String lname;
  public String address;
  public Double lat;
  public Double lng;
  public Long locationId;
  public Long positionId;
  public String country_short;
  public String formatted_address;
  public Integer type;
  public Boolean topPerformer = false;

}
