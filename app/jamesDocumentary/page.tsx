import React from 'react';
import { Text, TypographyStylesProvider, Center } from '@mantine/core';

export default function JamesDocumentary() {
  const longText = `
    The documentary is certainly dramatized, and a reasonably interesting watch. I did enjoy it, and there were notable aspects of it. Firstly,
    everything had dramatic music. This is a must considering it came from the History channel, but it was still notable. It also uses that dramatic
    music every time that nature does anything. I didn't quite like this, as it almost made nature seem malicious in its actions. There were several points
    they seemed to be critical of nature. Around 16:52, when referring to an invasive species, the documentary used overly dramatic music and named them
    "stealthy invaders," saying they "spread like a cancer." They also described the many ways that things on Earth needed humans, which was an odd angle
    to take, considering how much we need Earth. However, rats, mice, dogs, cockroaches, and more were named reliant on us (not that they aren't, to
    be clear). They also played heavily on ethos, as the history channel tends to do. They go and talk to everyone imaginable, which provides some chance
    of trustworthiness. There are about a billion examples of this, but I'll name Sackett from the Getty Research Institute, at roughly 1:00:25. They do
    use logos a lot in the documentary as well, referring to the science of how things work, making connections that you wouldn't expect. For instance,
    they discuss subways near the beginning, and then again later from 1:04:00 onwards. They note how they could flood and crash, and how that would impact
    the above landscape. They also address the more obvious things, addressing portions to the collapses of bridges and other super-structures. They 
    have their very fancy simulations, as always, shown notably around 45:00, but also throughout the documentary. Such graphics provide fantastic
    visualizations to viewers, and certainly adds to the experience of watching this documentary. We've worked a decent amount, and our presentation
    may focus on the odd take of nature being someowhat destructive.
  `;

  return (
    <Center style={{ minHeight: '100vh', padding: '20px' }}> 
      <div style={{ maxWidth: '900px', textAlign: 'left' }}> 
        <TypographyStylesProvider>
          <h3>Life After Humans Write-Up</h3>
         <Text component="p">
            {longText}
          </Text>
        </TypographyStylesProvider>

      </div>
    </Center>
  );
}