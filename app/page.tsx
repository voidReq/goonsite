"use client";

import { useState, useEffect } from 'react';
import { MantineProvider, Text, Switch, Rating, Image, Tooltip, Notification, Alert, Button, Progress } from '@mantine/core';
import '@mantine/core/styles.css';
import { IconArrowRight, IconInfoCircle, IconHeart} from '@tabler/icons-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Terminal } from './components/ui/Terminal';

export default function Home() {
  const [isGooning, setIsGooning] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [goodGooner, setGoodGooner] = useState(false);
  const icon = <IconInfoCircle />;

  return (
    <MantineProvider forceColorScheme = "dark">
      
      <div className="flex justify-center items-center min-h-screen flex-col px-4 py-8">

        <Terminal />

        <div className="mt-10 flex flex-col items-center">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center">
            <Link href="/goon-hub" style={{ textDecoration: 'none' }}><Button>Goon Hub</Button></Link>
            <Link href="/notes" style={{ textDecoration: 'none' }}><Button>My Personal notes</Button></Link>
          </div>
        </div>

        <div style={{marginTop: '40px'}}>
          <Switch 
            label="I am locked in." 
            style={{ marginBottom: '20px' }} 
            onChange={(event) => setIsGooning(event.currentTarget.checked)}
          />
        </div>

        {isGooning && (
          <div className="border-2 border-purple-600 p-4 sm:p-5 rounded-lg mx-4">
            <Text size="xl" fw={700} style={{ marginBottom: '10px' }}>
              Hello, Goon.
            </Text>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div>How locked in?</div>
              <Tooltip position="bottom" offset = {20} label="Disclaimer: By giving us a rating, you agree to your information (i.e., the rating)
                being sold for exorbitant prices">
                <Rating 
                  value={ratingValue}
                  onChange={(value) => {
                    setRatingValue(value);
                    if (value <= 4) {
                      setNotificationVisible(true);
                      setGoodGooner(false);
                    } else if (value === 5) {
                      setGoodGooner(true);
                      setNotificationVisible(false);
                    }
                  }} 
                  style={{ marginLeft: '10px' }} 
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

              <Link href="macbook" style={{ textDecoration: 'none' }}>
                <Button
                  variant="light"
                  leftSection={<IconHeart size={14} />}
                  rightSection={<IconArrowRight size={14} />}
                >
                  Visit the goon center
                </Button>
              </Link>
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
