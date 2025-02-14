"use client";

import { useState } from 'react';
import { MantineProvider, Text, Switch, Rating, Image, Tooltip, Notification, Alert, Button, Slider} from '@mantine/core';
import '@mantine/core/styles.css';
import { IconArrowRight, IconInfoCircle, IconHeart} from '@tabler/icons-react';
import Link from 'next/link';

export default function Home() {
  const [isGooning, setIsGooning] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [goodGooner, setGoodGooner] = useState(false);
  const icon = <IconInfoCircle />;

  return (
    <MantineProvider forceColorScheme = "dark">
      
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column'}}>


        <Image
          radius="md"
          h={400}
          w="auto"
          fit="contain"
          src="/IMG_9856.png"
          style={{marginBottom: '20px'}}
        />

        <Switch 
          label="I am currently gooning" 
          style={{ marginBottom: '20px' }} 
          onChange={(event) => setIsGooning(event.currentTarget.checked)}
        />

        {isGooning && (
          <div style={{ border: '2px solid purple', padding: '20px', borderRadius: '2px' }}>
            <Text size="xl" fw={700} style={{ marginBottom: '10px' }}>
              Hello, Gooner.
            </Text>

            <div style={{ display: 'flex', alignItems: 'center', padding: '10px'}}>
              <div style={{marginRight:'20px'}}>Gooning session quality:</div>
              <Tooltip position="bottom" offset = {20} label="Disclaimer: By giving us a rating, you agree to your information (i.e., the rating)
                being sold for exorbitant prices">
                <Slider 
                  value={ratingValue}
                  color="blue"
                  marks={[
                    { value: 20, label: '20%' },
                    { value: 50, label: '50%' },
                    { value: 80, label: '80%' },
                  ]}
                  style={{ width: '200px', marginLeft: '40px' }}
                  onChange={(value) => {
                    setRatingValue(value);
                    if (value <= 99) {
                      setNotificationVisible(true);
                      setGoodGooner(false);
                    } else if (value === 100) {
                      setGoodGooner(true);
                      setNotificationVisible(false);
                    }
                  }} 
                  //style={{ marginLeft: '10px' }} 
                />
              </Tooltip>
            </div>
          </div>
        )}

        {goodGooner && (
            <Alert 
              variant="light" 
              color="grape" 
              style={{
                position: 'fixed',
                top: '30px',
                right: '30px',
                zIndex: 1000
              }}
              icon={icon} 
              onClose={() => setGoodGooner(false)} 
              withCloseButton
            >
              <Text style={{ marginRight: "20px", marginBottom: "20px"}}>
                Good, very very good.
              </Text>

              <Button
                component={Link}
                href="/gooncenter"
                variant="light"
                leftSection={<IconHeart size={14} />}
                rightSection={<IconArrowRight size={14} />}
              >
                Visit the goon center
              </Button>
            </Alert>
        )}
        {notificationVisible && (
          <Notification 
            title={
              <>
                <Text>Perhaps you should goon better.<br /></Text>
                <Text style={{ color: 'red' }} fw={700} size="lg">Do better.</Text>
              </>
            } 
            onClose={() => setNotificationVisible(false)}
            style={{ position: 'absolute', bottom: 20, right: 20 }}
          >
          </Notification>
        )}

      </div>
      </MantineProvider>
  );
}
