import {
  Input,
  Box,
  Heading,
  Text,
  IconButton,
  Flex,
  Spacer,
  Button,
  color,
  Link,
  UnorderedList,
  Divider,
  FormControl,
  FormLabel,
  Container,
} from "@chakra-ui/react";
import { Module } from "../interfaces/planner";
import { CloseIcon } from "@chakra-ui/icons";
import { primaries } from "../constants/dummyModuleData";
import { Draggable } from "react-beautiful-dnd";
import { DEFAULT_MODULE_COLOR } from "../constants/moduleColor";
import {
  getGEsFromModuleList,
  getNUSModsModulePage,
} from "../utils/moduleUtils";
import {
  ReactElement,
  JSXElementConstructor,
  ReactFragment,
  useState,
  useEffect,
} from "react";
import {
  AsyncCreatableSelect,
  AsyncSelect,
  CreatableSelect,
  Select,
} from "chakra-react-select";
import { SingleValue, ActionMeta } from "react-select";
import * as models from "../models";
import { fetchBasicModuleInfo } from "../api/moduleAPI";

interface ModuleBoxProps {
  module: Module;
  displayModuleClose: boolean;
  handleModuleClose?: (module: Module) => void;
  parentStr: string;
  idx: number;
}

const ModuleBox = ({
  module,
  displayModuleClose,
  handleModuleClose,
  parentStr,
  idx,
}: ModuleBoxProps) => {
  const moduleColor = module.color ?? DEFAULT_MODULE_COLOR;
  let text: any;
  if (module.credits != null && module.credits > 0) {
    text = <Text fontSize={"xx-small"}>{module.credits}MCs</Text>;
  }

  let modName: any;
  let GEOptions = [];
  const [GEs, setGEs] = useState<Module[]>([]);
  const getGEs = async () => {
    const GEs = await getGEsFromModuleList(module.code.slice(1, 4));
    setGEs(GEs);
  };
  useEffect(() => {
    getGEs();
  }, []);

  let underlyingModule: models.Module | null = null;

  if (module.getUnderlyingModule) {
    const tempModule = module.getUnderlyingModule();
    if (tempModule !== undefined) {
      underlyingModule = tempModule;
    }
  }

  const handleChange = async (
    selectedModule: SingleValue<{ label: string; value: string }>,
    _: ActionMeta<{ label: string; value: string }>,
  ) => {
    if (selectedModule === null || selectedModule.value === undefined) return;

    const basicModuleInfo = await fetchBasicModuleInfo(selectedModule.value);
    let newUnderlyingModule: models.Module;
    if (basicModuleInfo === undefined) {
      newUnderlyingModule = new models.Module(selectedModule.value, "", 4);
    } else {
      newUnderlyingModule = new models.Module(
        basicModuleInfo.moduleCode,
        basicModuleInfo.title,
        basicModuleInfo.moduleCredit,
      );
    }

    if (module.selectModule !== undefined) {
      module.selectModule(newUnderlyingModule);
    }
  };

  if (module.name == "Select A Basket") {
    if (module.code.startsWith("^GE")) {
      for (let GE of GEs) {
        GEOptions.push({
          label: GE.code + " " + GE.name,
          value: GE.code,
        });
      }
      const selectStyles = {
        menu: (styles: any) => ({ ...styles, zIndex: 999 }),
      };
      modName = (
        <FormControl>
          <Select
            size="sm"
            options={[{ options: GEOptions }]}
            placeholder="Select a module"
            value={
              !!underlyingModule
                ? {
                    label: `${underlyingModule.code} ${underlyingModule.name}`,
                    value: underlyingModule.code,
                  }
                : undefined
            }
            closeMenuOnSelect={true}
            styles={selectStyles}
            menuPosition="fixed"
            onChange={handleChange}
          />
        </FormControl>
      );
    }
  } else {
    modName = (
      <Text color="black.900" fontSize={"xs"}>
        {module.name}
      </Text>
    );
  }

  //       modName = (
  //         <FormControl></FormControl>
  //         <Select
  // </FormControl>
  //       )
  //     } else {
  //     const moduleList = await fetchModulePrereqs(module.code);
  //       (mod: { moduleCode: string; title: string; semesters: number[] }) => {
  //         return {
  //           label: mod.moduleCode + " " + mod.title,
  //           value: mod.moduleCode,
  //         };
  //       },
  //     );
  //     modName = (
  //       <FormControl>
  //         <Select
  //           size="sm"
  //           options={moduleList}
  //           placeholder="Select a module"
  //           closeMenuOnSelect={false}
  //           colorScheme={moduleColor.split(".")[0]}
  //         />
  //       </FormControl>
  //     );
  //     }
  //
  // }

  // else {
  //   if (module.code.split(":")[0] == "Any Primary") {
  //     modName = (
  //       <Select
  //         placeholder="Select A Module"
  //         borderColor={"black"}
  //         size="sm"
  //         marginTop={"2"}
  //       >
  //         {primaries.map((primary, idx) => (
  //           <option key={idx}> {primary} </option>
  //         ))}
  //       </Select>
  //     );
  //   } else if (module.code.split(":")[0] == "Any UE") {
  //     modName = (
  //       <Input
  //         borderColor={"black"}
  //         size="sm"
  //         marginTop={"2"}
  //         placeholder="Key in a module"
  //       ></Input>
  //     );
  //   }
  // }

  const isValidModuleCode = !!module.code.match(/[A-Z]+\d+[A-Z]*/);

  let prereqsViolationText: any;

  if (module.prereqsViolated?.length) {
    let violations: string[] = [];
    for (let or of module.prereqsViolated) {
      violations.push(or.join(" or "));
    }
    prereqsViolationText = (
      <div>
        <Text fontSize={"xx-small"} color={"red.500"} pt="1">
          These modules need to be taken first:
        </Text>
        <UnorderedList fontSize={"xx-small"} color={"red.500"}>
          {violations.map((v, idx) => (
            <li key={idx}>{v}</li>
          ))}
        </UnorderedList>
      </div>
    );
  }

  return (
    <div>
      <Draggable
        key={module.code + "|" + parentStr}
        draggableId={module.code + "|" + parentStr}
        index={idx}
      >
        {(provided) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            <Box
              w="12rem"
              minH="5rem"
              bgColor={moduleColor}
              alignContent="center"
              borderRadius="0.4rem"
              padding="0.2rem 0.5rem"
            >
              <Flex>
                <Text fontSize={"medium"} color="black.900" fontWeight="bold">
                  {isValidModuleCode && (
                    <Link href={getNUSModsModulePage(module.code)} isExternal>
                      {module.code}
                    </Link>
                  )}
                  {!isValidModuleCode && <>{module.code.split(":")[0]}</>}
                </Text>
                <Spacer />
                {displayModuleClose && (
                  <IconButton
                    icon={<CloseIcon />}
                    aria-label="Remove Module"
                    size="xs"
                    bgColor={moduleColor}
                    color="black"
                    colorScheme={moduleColor}
                    onClick={() => {
                      if (handleModuleClose !== undefined) {
                        handleModuleClose(module);
                      }
                    }}
                  />
                )}
              </Flex>
              {modName}
              {text}
              {prereqsViolationText}
              <Text fontSize={"xx-small"}>{module.tags?.join(",")}</Text>
            </Box>
          </div>
        )}
      </Draggable>
    </div>
  );
};

export default ModuleBox;

// padding: $module-padding-v $module-padding-h;
// margin-bottom: 0.4rem;
// border-bottom: 0.15rem solid darken(theme-color('success'), 10);
// border-radius: 0.35rem;
// font-size: 0.9rem;
// line-height: 1.3;
// color: darken(theme-color('success'), 30);
// background: lighten(theme-color('success'), 3);
