import * as React from "react";
import styled from "styled-components";
import { Row, ButtonSecondary } from "./style";

const Label = styled.span`
  width: 100px;
  font-weight: 600;
  padding: 5px 0px;
`;

const StyledInput = styled.input`
  margin-right: 10px;
  padding: 8px 11px;
  max-width: 150px;
`;

const StyledRow = styled(Row)`
  align-items: center;
  margin: 5px 0px;
`;

const StyledSelect = styled.select`
  padding: 5px 8px;
`;

export const Input: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  const [val, setVal] = React.useState(value);

  React.useEffect(() => setVal(value), [value]);

  return (
    <StyledRow>
      <Label>{label}</Label>
      <StyledInput
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.keyCode === 13 && onChange(val)}
      />
      <ButtonSecondary onClick={() => onChange(val)}>Update</ButtonSecondary>
    </StyledRow>
  );
};

export const InputWithRange: React.FC<{
  label: string;
  value: string;
  range: [number, number];
  onChange: (value: string) => void;
}> = ({ label, range, value, onChange }) => {
  const [val, setVal] = React.useState(value);

  React.useEffect(() => setVal(value), [value]);

  return (
    <StyledRow>
      <Label>{label}</Label>
      <StyledInput
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => e.keyCode === 13 && onChange(val)}
      />
      <input
        type="range"
        min={range[0]}
        max={range[1]}
        value={val}
        onChange={(e) => onChange(e.target.value)}
      />
      <ButtonSecondary onClick={() => onChange(val)}>Update</ButtonSecondary>
    </StyledRow>
  );
};

export const InputSelect: React.FC<{
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => {
  return (
    <StyledRow>
      <Label>{label}</Label>
      <StyledSelect
        onChange={(e) => {
          onChange(e.target.value);
        }}
        value={value}
      >
        {options.map(([val, text]) => (
          <option value={val}>{text}</option>
        ))}
      </StyledSelect>
    </StyledRow>
  );
};
