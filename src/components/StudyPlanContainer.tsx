import {
  Spacer,
  Flex,
  IconButton,
  Text,
  Box,
  VStack,
  HStack,
} from "@chakra-ui/react";

import DeleteIcon from "@chakra-ui/icons";

import { Module, Semester } from "../interfaces/planner";
import ModuleBox from "./ModuleBox";
import { Droppable } from "react-beautiful-dnd";
import React, { useState } from "react";
import SemesterPlanner from "./SemesterPlanner";
import { convertYearAndSemToIndex } from "../utils/plannerUtils";

// Fix starting with 4 years (since we are not doing double degree for now)
// Ay is retrieved from the enrollment year from basic info
interface PlannerContainerProps {
  year: number;
  semesters: number[];
  id: string;
  plannerSemesters: Semester[];
  handleModuleClose: (module: Module) => void;
}

const StudyPlanContainer = ({
  year,
  semesters,
  id,
  plannerSemesters,
  handleModuleClose,
}: PlannerContainerProps) => {
  return (
    <Box
      alignItems="baseline"
      bgColor="blackAlpha.50"
      borderRadius="0.3rem"
      minH="22em"
      minW="28em"
      padding={3}
    >
      <Flex>
        <Box>
          <Text fontSize={"xs"} fontWeight="bold" color={"blackAlpha.600"}>
            Year {year}
          </Text>
        </Box>
        <Spacer />
      </Flex>
      <HStack scrollBehavior={"auto"} w="100%" align="">
        {semesters.map((semester) => {
          // const index = 2 * (Number(id) - 1) + Number(semester);
          const index = convertYearAndSemToIndex(Number(id), Number(semester));
          return (
            <SemesterPlanner
              semesterNumber={semester}
              id={"planner:" + index.toString()}
              semester={plannerSemesters[index]}
              semesterIdx={index}
              handleModuleClose={handleModuleClose}
              key={semester}
            ></SemesterPlanner>
          );
        })}
      </HStack>
    </Box>
  );
};

export default StudyPlanContainer;
