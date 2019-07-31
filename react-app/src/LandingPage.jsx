import React, { useState, useEffect } from "react";
import styled from "styled-components";
import solace from "solclientjs";
import {SolaceClient} from "./solace/solace-client-login";
import { pubsubplus_config } from "./solace/pubsubplus-config";
import {makeRequest} from "./api/HttpClient";

/**
 * Styling
 */
const Body = styled.div`
  font-family: Arial, sans-serif;
  color: #00cb95;
  background: #000000;
  height: 100%;
  width: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
`;

const Button = styled.div`
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 20px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  margin: 4px 2px;
`;

const QRImage = styled.div`
  
`;

/*
 * Logic 
 */

function displayDashboard(solaceclient) {
  solaceclient.publish(pubsubplus_config.start_topic_prefix+"/"+sessionId,"{'start':true}")
}

function LandingPage() {
  const [session, setSession] = useState(null);
  const [client, setClient] = useState(null);
  const [stations, setStations] = useState([]);
  const [btnDashboardDisabled, setButtonDashboardDisabled] = useState(true);

   useEffect(() => {
    let sessionId = ((Math.random() * 0xffffff) << 0).toString(16);

    // Initialize factory with the most recent API defaults
    var factoryProps = new solace.SolclientFactoryProperties();
    factoryProps.profile = solace.SolclientFactoryProfiles.version10;
    solace.SolclientFactory.init(factoryProps);
    // enable logging to JavaScript console at WARN level
    // NOTICE: works only with "solclientjs-debug.js"
    solace.SolclientFactory.setLogLevel(solace.LogLevel.WARN);
    let solaceclient = new SolaceClient(
      pubsubplus_config.login_topic_prefix + "/" + sessionId,
      function loginPump(message) {
        let loginMessage = JSON.parse(message.getBinaryAttachment());
        setStations(prevStations => [...prevStations, loginMessage.name]);
        if(stations.length>=1){
          setButtonDashboardDisabled(false);
        }
      }

    );
    solaceclient.connectToSolace();
    
   
    async function fetchData() {
    
    console.log(pubsubplus_config.semp_host);


    
    let request_object = {};
    request_object.baseUrl=pubsubplus_config.semp_host;
    request_object.body=JSON.stringify({"accessType":"exclusive","consumerAckPropagationEnabled":true,"deadMsgQueue":"#DEAD_MSG_QUEUE","egressEnabled":false,"eventBindCountThreshold":{"clearPercent":60,"setPercent":80},
    "eventMsgSpoolUsageThreshold":{"clearPercent":60,"setPercent":80},"eventRejectLowPriorityMsgLimitThreshold":{"clearPercent":60,"setPercent":80},"ingressEnabled":true,"maxBindCount":1000,
    "maxDeliveredUnackedMsgsPerFlow":10000,"maxMsgSize":10000000,"maxMsgSpoolUsage":1500,"maxRedeliveryCount":0,"maxTtl":0,"msgVpnName":pubsubplus_config.vpn,
    "owner":pubsubplus_config.username,"permission":"consume","queueName":"gaspump-queue-"+sessionId,"rejectLowPriorityMsgEnabled":false,"rejectLowPriorityMsgLimit":0,
    "rejectMsgToSenderOnDiscardBehavior":"when-queue-enabled","respectMsgPriorityEnabled":false,"respectTtlEnabled":false});
    request_object.endpoint='/SEMP/v2/config/msgVpns/'+pubsubplus_config.vpn+'/queues/gaspump-queue-'+sessionId;
    request_object.headers=[{'Content-Type': 'application/json'}];
    request_object.method='PATCH';
    request_object.basicAuthUsername=pubsubplus_config.semp_user;
    request_object.basicAuthPassword=pubsubplus_config.semp_password;

    let res =  await makeRequest(
      request_object
    ).catch((err)=>function(err){
      console.log(err);
    });

    console.log(res);
  };

  fetchData();

    setSession(sessionId);
    setClient(solaceclient);

  }, []);

  return (
    <Body>
      <h1 align="center">Solace MQTT Gas Pump Demo</h1>
      <div
        dangerouslySetInnerHTML={{
          __html:
            "<img src=https://api.qrserver.com/v1/create-qr-code/?data=" +
            session +
            "&amp;size=200x200&amp;color=00CB95&amp;bgcolor=333333>"
        }}
      />
      <br />
      <br />
      <div>
        Scan QR Code with your mobile phone to turn it into a gas station!
      </div>
      <Button
          class="button"
          disbaled={btnDashboardDisabled}
          id="btnDashboard"
          onclick={() => displayDashboard(client)}
        >
          {stations.length} Stations Connected
        </Button>
    </Body>
  );
}

export default LandingPage;
