package com.talytica.survey.objects;

import java.util.UUID;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class NewGrader {
  public UUID respondantUuid;
  public String email;
  public String fname;
  public String lname;
  public String phone;

}
