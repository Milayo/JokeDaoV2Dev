import { Button, Col, Divider, Input, Row, Tooltip } from "antd";
import React, { useState } from "react";

import { Transactor } from "../../helpers";
import { tryToDisplay, tryToDisplayAsText } from "./utils";

const { utils } = require("ethers");

const getFunctionInputKey = (functionInfo, input, inputIndex) => {
  const name = input?.name ? input.name : "input_" + inputIndex + "_";
  return functionInfo.name + "_" + name + "_" + input.type;
};

export default function VotingFunctionForm({ proposalId, castVoteContractFunction, castVoteFunctionInfo, provider, gasPrice, triggerRefresh }) {
  const [form, setForm] = useState({});
  const [returnValue, setReturnValue] = useState();

  const tx = Transactor(provider, gasPrice);

  console.log(castVoteFunctionInfo.inputs)

  const inputs = castVoteFunctionInfo.inputs.filter(input => input.name == "numVotes").map((input, inputIndex) => {
    const key = getFunctionInputKey(castVoteFunctionInfo, input, inputIndex);

    let buttons = "";
    buttons = (
      <Tooltip placement="right" title="* 10 ** 18">
        <div
          type="dashed"
          style={{ cursor: "pointer" }}
          onClick={async () => {
            const formUpdate = { ...form };
            formUpdate[key] = utils.parseEther(form[key]);
            setForm(formUpdate);
          }}
        >
          ✴️
        </div>
      </Tooltip>
    );

    return (
      <div style={{ margin: 2 }} key={key}>
        <Input
          size="large"
          placeholder="number of votes to cast"
          autoComplete="off"
          value={form[key]}
          name={key}
          onChange={event => {
            const formUpdate = { ...form };
            formUpdate[event.target.name] = event.target.value;
            setForm(formUpdate);
          }}
          suffix={buttons}
        />
      </div>
    );
  });

  const handleForm = returned => {
    if (returned) {
      setForm({});
    }
  };

  const buttonIcon = <Button style={{ marginLeft: -32 }}>Vote</Button>
  inputs.push(
    <div style={{ cursor: "pointer", margin: 2 }} key="goButton">
      <Input
        onChange={e => setReturnValue(e.target.value)}
        defaultValue=""
        bordered={false}
        disabled
        value={returnValue}
        suffix={
          <div
            style={{ width: 50, height: 30, margin: 0 }}
            type="default"
            onClick={async () => {
              // Only get the numVotes arg, I pre-fill the rest for now
              const numVotesArg = castVoteFunctionInfo.inputs.filter(input => input.name == "numVotes").map((input, inputIndex) => {
                const key = getFunctionInputKey(castVoteFunctionInfo, input, inputIndex);
                let value = form[key];
                return value;
              });

              const args = [proposalId, utils.parseEther("0"), numVotesArg[0]] // propId, support (only option is 0 or For for now), and numVotes

              let result;
              if (castVoteFunctionInfo.stateMutability === "view" || castVoteFunctionInfo.stateMutability === "pure") {
                try {
                  const returned = await castVoteContractFunction(...args);
                  handleForm(returned);
                  result = tryToDisplayAsText(returned);
                } catch (err) {
                  console.error(err);
                }
              } else {
                const overrides = {};
                if (gasPrice) {
                  overrides.gasPrice = gasPrice;
                }
                // Uncomment this if you want to skip the gas estimation for each transaction
                // overrides.gasLimit = hexlify(1200000);

                // console.log("Running with extras",extras)
                const returned = await tx(castVoteContractFunction(...args, overrides));
                handleForm(returned);
                result = tryToDisplay(returned);
              }

              console.log("SETTING RESULT:", result);
              setReturnValue(result);
              triggerRefresh(true);
            }}
          >
            {buttonIcon}
          </div>
        }
      />
    </div>,
  );

  return (
    <div>
      <Row>
        <Col span={24}>{inputs}</Col>
      </Row>
      <Divider />
    </div>
  );
}
