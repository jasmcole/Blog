import * as React from 'react';
import styled from 'styled-components';

export const theme = {
  primary: 'rgb(148, 148, 254)',
  lightGrey: 'rgb(245,245,245)',
  darkGrey: 'rgb(220, 220, 220);',
  darkerGrey: 'rgb(200, 200, 200);',
  veryLightGrey: 'rgba(240, 240, 240, 0.2)',
};

export const Row = styled.div`
  display: flex;
`;

export const RowV = styled(Row)`
  align-items: center;
`;

export const RowHV = styled(Row)`
  align-items: center;
  justify-content: center;
`;

export const Col = styled(Row)`
  flex-direction: column;
  flex: 1;
`;

export const Button = styled.button`
  background: ${theme.lightGrey};
  border-radius: 4px;
  border: 1px solid ${theme.darkGrey};
  padding: 3px 7px;
  cursor: pointer;
  user-select: none;
  transition: 200ms ease-out;
  margin-left: 8px;

  &:hover {
    border: 1px solid rgb(199, 199, 255);
    color: ${theme.primary};
    &:active {
      background: white;
    }
  }
  &:focus {
    outline: none;
  }
`;

export const ButtonCommand = styled.span`
  margin-left: 8px;
  transition: 200ms ease-out;
`;
