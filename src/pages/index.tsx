import {
  Button,
  Heading,
  Select,
  Box,
  HStack,
  StackDivider,
  VStack,
} from "@chakra-ui/react";
import ModuleBox from "../components/OldModuleBox";
import { useState, useCallback } from "react";
import { Module, Requirement, ModulesState } from "../interfaces/planner";
import { insertAtIndex, removeAtIndex } from "../utils/dndUtils";
import RequirementContainer from "../components/RequirementContainer";
import PlannerContainer from "../components/PlannerContainer";
import {
  dummyModuleState,
  sampleModuleRequirements,
} from "../constants/dummyModuleData";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

interface Container {
  id: string;
  containerType: "requirement" | "planner" | "";
}

// Container id naming scheme:
// For requirements: Container id = requirements.title
// For planner: Container id = planner array idx (0,1,2,...)
// Concern: Do we care about special term?

const Home = () => {
  // Helper function to help refresh since react-beautiful-dnd can't detect some changes
  const [, updateState] = useState<{}>();
  const forceUpdate = useCallback(() => updateState({}), []);

  const sortRequirementModules = (): void => {
    const modReqMap = new Map();
    setModulesState((state) => {
      for (let requirement of state.requirements) {
        for (let module of requirement.modules) {
          modReqMap.set(module.code, module);
        }
      }

      console.log(modReqMap);
      console.log(moduleRequirementsCodes);

      for (let i = 0; i < moduleRequirementsCodes.length; i++) {
        state.requirements[i].modules = [];
        for (let code of moduleRequirementsCodes[i]) {
          if (modReqMap.has(code)) {
            state.requirements[i].modules.push(modReqMap.get(code));
          }
        }
      }

      return state;
    });
    forceUpdate();
  };

  const handleDragEnd = (event) => {
    const { source, destination, draggableId } = event;
    // e.g.
    //source = { index: 0, droppableId: "requirement:4" }
    // destination = { index: 2, droppableId: "requirement:4" }
    // CS1231S

    if (!destination) return;

    const [sourceType, sourceId] = source.droppableId.split(":");
    const [destinationType, destinationId] = destination.droppableId.split(":");

    moveModule(
      sourceType,
      sourceId,
      source.index,
      destinationType,
      destinationId,
      destination.index,
      draggableId
    );
  };

  const moveModule = (
    sourceType,
    sourceId,
    sourceIndex,
    destinationType,
    destinationId,
    destinationIndex,
    draggableId
  ) => {
    setModulesState((state) => {
      // Removes module from planner or requirements list
      // Note: You have to filter through everything when sourceType is requirement
      // Reason: A mod (e.g. CS2103T) can appear more than once in requirements list
      if (sourceType === "planner") {
        state.planner[sourceId].modules = removeAtIndex(
          state.planner[sourceId].modules,
          sourceIndex
        );
      } else if (sourceType === "requirement") {
        state.requirements = state.requirements.map((x) => ({
          ...x,
          modules: x.modules.filter((mod) => mod.code !== draggableId),
        }));
      }

      if (!moduleMap.has(draggableId)) return state;

      // Implementation Concerns:

      const mod = moduleMap.get(draggableId);

      // Adds module into planner or requirements list
      // Requirement can appear more than once, so just insert at the beginning and sort after
      if (destinationType == "requirement") {
        state.requirements[0].modules.push(mod);
      } else if (destinationType == "planner") {
        console.log(destinationId, destinationIndex);
        state.planner[destinationId].modules = insertAtIndex(
          state.planner[destinationId].modules,
          destinationIndex,
          mod
        );
      }

      console.log("state");
      console.log(state);

      return state;
    });
    sortRequirementModules();
  };

  const handleModuleClose = (module: Module) => {
    console.log("handle module close", module.code);
    console.log(modulesState);
    setModulesState((state) => {
      state.planner = state.planner.map((x) => ({
        ...x,
        modules: x.modules.filter((mod) => mod.code !== module.code),
      }));
      // for (let i = 0; i < state.planner.length; i++) {
      //   for (let j = 0; j < state.planner[i].modules.length; j++) {
      //     if (state.planner[i].modules[j].code === module.code) {
      //       state.planner[i].modules = removeAtIndex(
      //         state.planner[i].modules,
      //         j
      //       );
      //       break;
      //     }
      //   }
      // }
      console.log(state.planner);
      state.requirements[0].modules.push(module);
      forceUpdate();
      return state;
    });

    console.log(modulesState);

    sortRequirementModules();
  };

  const [moduleRequirements, setModuleRequirements] = useState(
    sampleModuleRequirements
  );

  const [modulesState, setModulesState] =
    useState<ModulesState>(dummyModuleState);

  const moduleRequirementsCodes = sampleModuleRequirements.map((x) =>
    x.modules.map((mod) => mod.code)
  );

  // list of all available modules
  const moduleMap = new Map();
  for (let requirement of moduleRequirements) {
    for (let module of requirement.modules) {
      moduleMap.set(module.code, module);
    }
  }

  return (
    <div>
      <HStack padding="1em 0.8em 0.1em 1.2em">
        <Heading
          fontSize={"2xl"}
          fontWeight={"bold"}
          fontFamily={"body"}
          paddingRight="1em"
        >
          NUS Planner
        </Heading>
        <Select
          placeholder="Choose your enrollment year"
          width={"15rem"}
          padding=""
        >
          <option>AY2019/2020</option>
        </Select>
        <Select placeholder="Choose your major" width={"15rem"} padding="">
          <option>Computer Science</option>
        </Select>
        <Select placeholder="Choose your focus areea" width={"15rem"}>
          <option>Algorithms & Theory</option>
        </Select>
      </HStack>

      <div />
      <Heading
        fontSize={"xl"}
        fontWeight={"bold"}
        fontFamily={"body"}
        padding="1em 1em 0.5em"
      >
        Required Modules
      </Heading>
      <DragDropContext onDragEnd={handleDragEnd}>
        
          <Box bgColor="purple.50" margin="0em 1em 0em 1em" borderColor="black">
            {modulesState.requirements.map((requirement, id) => (
              <RequirementContainer
                requirement={requirement}
                id={"requirement:" + id.toString()}
                key={id}
              />
            ))}
          </Box>
        
        <HStack padding="1.5em 1em 0.5em">
          <Heading
            fontSize={"xl"}
            fontWeight={"bold"}
            fontFamily={"body"}
            paddingRight="1em"
          >
            Study Plan
          </Heading>
          <Button size="sm" colorScheme={"white"} variant="outline">
            + New Semester
          </Button>
        </HStack>
        <Box margin="0em 0.5em 4em" borderColor="black" padding="0.5em">
          <HStack align="top">
            {modulesState.planner.map((semester, id) => (
              <PlannerContainer
                semester={semester}
                handleModuleClose={handleModuleClose}
                id={"planner:" + id.toString()}
                key={id}
              />
            ))}
          </HStack>
        </Box>
      </DragDropContext>
    </div>
  );
};

export default Home;
