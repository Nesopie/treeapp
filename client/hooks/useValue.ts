import React, { useState } from "react";

export const useValue = (initialValue: string) => {
    const [value, setValue] = useState<string>(initialValue);

    const onValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.target.value);
    };

    return { value, onValueChange, setValue };
};
