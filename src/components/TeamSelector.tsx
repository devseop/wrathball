import React from 'react';
import styled from '@emotion/styled';
import { Team, TEAMS } from '../const/team';

interface TeamSelectorProps {
  selectedTeam: Team | null;
  onTeamSelect: (team: Team) => void;
  onTeamDeselect: () => void;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({ selectedTeam, onTeamSelect, onTeamDeselect }) => {
  return (
    <SelectorContainer>
      {selectedTeam ? (
        <SelectedTeam>
          <span>{selectedTeam}</span>
          <DeselectButton onClick={onTeamDeselect}>×</DeselectButton>
        </SelectedTeam>
      ) : (
        <TeamGrid>
          {TEAMS.map((team) => (
            <TeamItem key={team} onClick={() => onTeamSelect(team as Team)}>
              {team}
            </TeamItem>
          ))}
        </TeamGrid>
      )}
    </SelectorContainer>
  );
};

const SelectorContainer = styled.div`
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 12px;
  background-color: white;
  padding: 16px;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const TeamItem = styled.button`
  padding: 12px 16px;
  border: none;
  border-radius: 16px;
  background-color: transparent;
  color: black;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;
  white-space: nowrap;
  min-width: 100px;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const SelectedTeam = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: white;
  padding: 8px 16px;
  border-radius: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const DeselectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: black;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0e0e0;
  }
`; 