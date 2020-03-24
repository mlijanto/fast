import React, { ComponentClass, FunctionComponent } from "react";
import {
    dictionaryLink,
    MapperConfig,
    PropertyKeyword,
    ResolverConfig,
} from "@microsoft/fast-tooling";

export interface ComponentDictionary {
    [key: string]: FunctionComponent<any> | ComponentClass<any> | string;
}

/**
 * A mapping function intended to be used with the
 * `mapDataDictionary` export from the @microsoft/fast-tooling library
 */
export function reactMapper(
    componentDictionary: ComponentDictionary
): (config: MapperConfig<JSX.Element>) => void {
    return (config: MapperConfig<JSX.Element>): void => {
        if (typeof config.dataDictionary[0][config.dictionaryId].data === "string") {
            return;
        }

        const allAvailableProps = Object.keys(config.schema[PropertyKeyword.properties]);

        config.dataDictionary[0][config.dictionaryId].data = {
            component: componentDictionary[config.schema.id],
            props: allAvailableProps
                .filter(potentialProp => {
                    // remove slots from the attributes list
                    return !allAvailableProps
                        .filter((propName: string) => {
                            if (
                                config.schema[PropertyKeyword.properties][propName][
                                    dictionaryLink
                                ]
                            ) {
                                return propName;
                            }
                        })
                        .includes(potentialProp);
                })
                .reduce((previousValue: {}, currentValue: string) => {
                    return {
                        ...previousValue,
                        [currentValue]: allAvailableProps[currentValue],
                    };
                }, {}),
        };
    };
}

/**
 * A resolver function intended to be used with the
 * `mapDataDictionary` export from the @microsoft/fast-tooling library
 */
export function reactResolver(config: ResolverConfig<unknown>): any {
    if (config.dataDictionary[1] !== config.dictionaryId) {
        // the original data in the children location
        const childrenAtLocation =
            config.dataDictionary[0][
                config.dataDictionary[0][config.dictionaryId].parent.id
            ].data.props[
                config.dataDictionary[0][config.dictionaryId].parent.dataLocation
            ];
        // the child item being resolved to a react component
        const newChildrenAtLocation =
            typeof config.dataDictionary[0][config.dictionaryId].data === "string"
                ? config.dataDictionary[0][config.dictionaryId].data
                : React.createElement(
                      config.dataDictionary[0][config.dictionaryId].data.component,
                      {
                          ...config.dataDictionary[0][config.dictionaryId].data.props,
                          key: Array.isArray(childrenAtLocation)
                              ? childrenAtLocation.length
                              : 0,
                      }
                  );

        // re-assign this prop with the new child item
        config.dataDictionary[0][
            config.dataDictionary[0][config.dictionaryId].parent.id
        ].data.props[config.dataDictionary[0][config.dictionaryId].parent.dataLocation] =
            childrenAtLocation === undefined
                ? [newChildrenAtLocation]
                : [newChildrenAtLocation, ...childrenAtLocation];
    }

    if (typeof config.dataDictionary[0][config.dictionaryId].data === "string") {
        return config.dataDictionary[0][config.dictionaryId].data;
    }

    return React.createElement(
        config.dataDictionary[0][config.dictionaryId].data.component,
        config.dataDictionary[0][config.dictionaryId].data.props
    );
}
