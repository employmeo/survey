package com.talytica.survey.objects;

import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@EqualsAndHashCode
@ToString
public class FountainRequest {
  public String fountainId;
  public String redirectUrl;
}
