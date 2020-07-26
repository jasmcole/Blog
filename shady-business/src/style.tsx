import styled from "styled-components";

export const Row = styled.div`
  display: flex;
`;

export const Column = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Button = styled.button`
  background: rgb(0, 117, 255);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  border: none;
  font-size: 14px;
  padding: 8px 11px;
  font-weight: 600;
  margin: 5px;
`;

export const ButtonSecondary = styled.button`
  background: rgb(230, 230, 230);
  color: rgb(50, 50, 50);
  border-radius: 4px;
  cursor: pointer;
  user-select: none;
  border: 1px solid rgb(180, 180, 180);
  font-size: 14px;
  padding: 8px 11px;
  font-weight: 600;
  margin: 5px;

  &:hover {
    background: rgb(240, 240, 240);
  }
`;

export const Title = styled.div`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 10px;
  margin-top: 20px;
`;
