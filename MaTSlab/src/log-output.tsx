import * as React from 'react';
import Inspector from 'react-inspector';
import styled from 'styled-components';
import { Row, theme } from './style';

export interface LogEntry {
  timestamp: Date;
  payload: unknown[];
  type: 'error' | 'info';
}

export const LogOutput: React.FC<LogEntry> = ({ timestamp, payload, type }) => {
  return (
    <Outer error={type === 'error'}>
      <Explorer>
        {payload.map(entry => (
          <Entry entry={entry} error={type === 'error'} />
        ))}
      </Explorer>
      <Timestamp>{timestamp.toLocaleTimeString()}</Timestamp>
    </Outer>
  );
};

const Outer = styled(Row)<{ error: boolean }>`
  border: 1px solid transparent;
  &:hover {
    border: 1px solid ${theme.lightGrey};
  }
`;

const Explorer = styled(Row)`
  flex-grow: 1;
`;

const Timestamp = styled.span`
  font-size: 12px;
  font-family: monospace;
  color: ${theme.darkerGrey};
`;

const EntryOuter = styled.div`
  margin-right: 14px;
`;

const Entry: React.FC<{ entry: unknown; error: boolean }> = ({
  entry,
  error,
}) => {
  if (error) {
    return (
      <EntryOuter>
        <Inspector
          data={{
            error: (entry as Error).message,
          }}
        />
      </EntryOuter>
    );
  }
  return (
    <EntryOuter>
      <Inspector data={entry} />
    </EntryOuter>
  );
};
