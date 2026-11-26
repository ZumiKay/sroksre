"use client";

import {
  Button,
  Chip,
  Input,
  Listbox,
  ListboxItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Selection,
  Spinner,
  cn,
} from "@heroui/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import {
  KeyboardEvent,
  ReactNode,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { useScreenSize } from "@/src/context/CustomHook";

export interface SelectOption {
  label: string;
  value: string | number;
  /** CSS color shown as a swatch next to the label */
  color?: string;
}

export type LoadOptionsResult =
  SelectOption[] | { options: SelectOption[]; hasMore?: boolean };

/**
 * Adapts a server result for `loadOptions`. A full page means there may be
 * more, which shows the "Load more" button.
 */
export const pagedResult = (
  res: { success?: boolean; data?: SelectOption[] } | null | undefined,
  limit: number,
): LoadOptionsResult => {
  const options = res?.success ? (res.data ?? []) : [];
  return { options, hasMore: options.length >= limit };
};

interface CommonProps {
  label?: string;
  /** Accessible name when there is no visible label */
  ariaLabel?: string;
  placeholder?: string;
  /** Static options. Ignored when `loadOptions` is given. */
  options?: SelectOption[];
  /**
   * Fetch options from the server. `limit` grows by `pageSize` each time the
   * user presses "Load more"; return `{ options, hasMore }` to enable it.
   */
  loadOptions?: (query: string, limit: number) => Promise<LoadOptionsResult>;
  /** Load options as soon as it opens, before anything is typed */
  searchOnEmpty?: boolean;
  pageSize?: number;
  /** Show a search box. Defaults to on for async or long option lists. */
  searchable?: boolean;
  isLoading?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  /** Show an ✕ that clears the value */
  isClearable?: boolean;
  /** Submit the value with a native form under this name */
  name?: string;
  size?: "sm" | "md" | "lg";
  /** Extra content after the label, e.g. an "Optional" badge */
  labelEnd?: ReactNode;
  isInvalid?: boolean;
  errorMessage?: string;
  className?: string;
}

interface SingleProps extends CommonProps {
  selectionMode?: "single";
  /** A value, or the option itself (needed when options load from the server) */
  value?: string | number | SelectOption | null;
  /** `value` is "" when cleared */
  onChange: (value: string, option?: SelectOption) => void;
  /** Add a "None" option that clears the value */
  allowNone?: boolean;
  noneLabel?: string;
}

interface MultipleProps extends CommonProps {
  selectionMode: "multiple";
  value: SelectOption[];
  onChange: (value: SelectOption[]) => void;
}

export type SelectFieldProps = SingleProps | MultipleProps;

const NONE_KEY = "__none__";
const SEARCH_THRESHOLD = 8;
const SEARCH_DELAY_MS = 300;

const key = (v: string | number) => String(v);

const SIZE_CLASSES = {
  sm: "min-h-9 rounded-lg border px-2.5 py-1 text-xs sm:text-sm",
  md: "min-h-10 rounded-lg border px-3 py-1.5 text-sm",
  lg: "min-h-12 rounded-xl border-2 px-3 py-2 text-sm",
};

/**
 * One select for the whole app: single or multi, static or server search.
 * Opens as a popover on desktop and as a centered modal on phones.
 */
export function SelectField(props: SelectFieldProps) {
  const {
    label,
    ariaLabel,
    placeholder = "Select",
    options = [],
    loadOptions,
    searchOnEmpty,
    pageSize = 10,
    isLoading,
    isRequired,
    isDisabled,
    isClearable,
    name,
    size = "lg",
    labelEnd,
    errorMessage,
    className,
  } = props;
  const isMulti = props.selectionMode === "multiple";
  const isAsync = !!loadOptions;
  const accessibleName = label ?? ariaLabel ?? placeholder;

  const { isMobile } = useScreenSize();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const [remoteOptions, setRemoteOptions] = useState<SelectOption[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [searching, setSearching] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [triggerWidth, setTriggerWidth] = useState<number>();
  const [portalContainer, setPortalContainer] = useState<HTMLElement>();
  const [modalContainer, setModalContainer] = useState<HTMLElement>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef("");

  const searchable =
    props.searchable ?? (isAsync || options.length >= SEARCH_THRESHOLD);

  // ---------- selected value(s) ----------

  const selectedOptions: SelectOption[] = (() => {
    if (props.selectionMode === "multiple") return props.value;
    const v = props.value;
    if (v === undefined || v === null || v === "") return [];
    if (typeof v === "object") return [v];
    const match = [...options, ...remoteOptions].find(
      (o) => key(o.value) === key(v),
    );
    return match ? [match] : [];
  })();
  const selectedKeys = new Set(selectedOptions.map((o) => key(o.value)));
  const hasValue = selectedOptions.length > 0;
  const showInvalid = invalid || !!props.isInvalid;

  // ---------- options shown in the list ----------

  const visibleOptions = ((): SelectOption[] => {
    if (isAsync) return remoteOptions;
    const q = query.trim().toLowerCase();
    const filtered = q
      ? options.filter((o) => o.label.toLowerCase().includes(q))
      : options;
    if (props.selectionMode !== "multiple" && props.allowNone && !q) {
      return [
        { label: props.noneLabel ?? "-- None --", value: NONE_KEY },
        ...filtered,
      ];
    }
    return filtered;
  })();

  // ---------- server search ----------

  const runSearch = useEffectEvent(async (q: string, take: number) => {
    if (!loadOptions) return;
    setSearching(true);
    try {
      const result = await loadOptions(q, take);
      const list = Array.isArray(result) ? result : result.options;
      setRemoteOptions(list);
      setHasMore(!Array.isArray(result) && !!result.hasMore);
    } catch (error) {
      console.log("SelectField search failed:", error);
    } finally {
      setSearching(false);
    }
  });

  // Depends on `isAsync`, not `loadOptions`: callers pass inline functions,
  // which would otherwise refetch on every render.
  useEffect(() => {
    if (!isAsync || !open) return;
    const q = query.trim();
    if (!q && !searchOnEmpty) return;
    // Typing waits for a pause; opening and "Load more" fetch at once
    const delay = q !== lastQueryRef.current ? SEARCH_DELAY_MS : 0;
    lastQueryRef.current = q;
    const timer = setTimeout(() => runSearch(q, limit), delay);
    return () => clearTimeout(timer);
  }, [isAsync, open, query, limit, searchOnEmpty]);

  // ---------- open / close ----------

  const handleOpenChange = (next: boolean) => {
    if (isDisabled) return;
    if (next) {
      const el = triggerRef.current;
      setTriggerWidth(el?.offsetWidth);
      // Render inside a parent modal so it stays interactive and above it.
      // ".modal__container" is the app's own <Modal>, which has a high z-index.
      const appModal =
        el?.closest<HTMLElement>(".modal__container") ?? undefined;
      setPortalContainer(
        el?.closest<HTMLElement>('[role="dialog"]') ?? appModal,
      );
      setModalContainer(appModal);
    } else {
      setQuery("");
      setLimit(pageSize);
      setRemoteOptions([]);
      setHasMore(false);
      lastQueryRef.current = "";
    }
    setOpen(next);
  };

  // ---------- changes ----------

  const handleSelectionChange = (keys: Selection) => {
    if (keys === "all") return;
    const next = new Set([...keys].map(String));
    setInvalid(false);

    if (props.selectionMode !== "multiple") {
      const [picked] = next;
      // Tapping the current value again leaves it as is
      if (picked !== undefined) {
        if (picked === NONE_KEY) props.onChange("");
        else {
          const option = visibleOptions.find((o) => key(o.value) === picked);
          props.onChange(picked, option);
        }
      }
      handleOpenChange(false);
      return;
    }

    const visibleKeys = new Set(visibleOptions.map((o) => key(o.value)));
    const kept = props.value.filter(
      (o) => !visibleKeys.has(key(o.value)) || next.has(key(o.value)),
    );
    const added = visibleOptions.filter(
      (o) => next.has(key(o.value)) && !selectedKeys.has(key(o.value)),
    );
    props.onChange([...kept, ...added]);
  };

  const removeOption = (value: string | number) => {
    if (props.selectionMode !== "multiple") return;
    props.onChange(props.value.filter((o) => key(o.value) !== key(value)));
  };

  const clearAll = () => {
    if (props.selectionMode === "multiple") props.onChange([]);
    else props.onChange("");
  };

  const listSelectedKeys =
    props.selectionMode !== "multiple" && !hasValue && props.allowNone
      ? new Set([NONE_KEY])
      : selectedKeys;

  const emptyText = searching
    ? "Searching..."
    : isAsync && !query.trim() && !searchOnEmpty
      ? "Type to search"
      : isAsync || query.trim()
        ? "No results"
        : "No options";

  // ---------- pieces shared by the popover and the modal ----------

  const swatch = (color?: string) =>
    color ? (
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full border border-gray-300"
        style={{ backgroundColor: color }}
      />
    ) : undefined;

  const searchBox = searchable && (
    <Input
      autoFocus={!isMobile}
      size="sm"
      variant="bordered"
      placeholder="Search..."
      aria-label={`Search ${accessibleName}`}
      value={query}
      onValueChange={(v) => {
        setQuery(v);
        setLimit(pageSize);
        if (isAsync && !v.trim() && !searchOnEmpty) setRemoteOptions([]);
      }}
      startContent={
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="text-xs text-gray-400"
        />
      }
      endContent={searching ? <Spinner size="sm" /> : null}
      classNames={{ inputWrapper: "border-gray-200" }}
    />
  );

  const chips = (onPanel: boolean) =>
    isMulti && hasValue ? (
      <div className={`flex flex-wrap gap-1.5 ${onPanel ? "" : "py-0.5"}`}>
        {selectedOptions.map((o) => (
          <Chip
            key={key(o.value)}
            size="sm"
            variant="flat"
            startContent={swatch(o.color)}
            onClose={isDisabled ? undefined : () => removeOption(o.value)}
          >
            {o.label}
          </Chip>
        ))}
      </div>
    ) : null;

  const list = (
    <>
      <Listbox
        aria-label={accessibleName}
        items={visibleOptions.map((o) => ({ ...o, id: key(o.value) }))}
        selectionMode={isMulti ? "multiple" : "single"}
        selectedKeys={listSelectedKeys}
        onSelectionChange={handleSelectionChange}
        emptyContent={emptyText}
        shouldFocusWrap
        classNames={{ list: "gap-0.5" }}
      >
        {(item) => (
          <ListboxItem
            key={item.id}
            textValue={item.label}
            startContent={swatch(item.color)}
            className={isMobile ? "py-3" : undefined}
          >
            {item.label}
          </ListboxItem>
        )}
      </Listbox>
      {hasMore && visibleOptions.length > 0 && (
        <Button
          size="sm"
          variant="light"
          fullWidth
          isLoading={searching}
          onPress={() => setLimit((l) => l + pageSize)}
          className="mt-1 font-semibold text-gray-600"
        >
          Load more
        </Button>
      )}
    </>
  );

  // ---------- trigger ----------

  const triggerContent: ReactNode = isMulti ? (
    hasValue ? (
      chips(false)
    ) : (
      <span className="text-gray-400">{placeholder}</span>
    )
  ) : (
    <span
      className={`flex items-center gap-2 truncate ${hasValue ? "text-gray-900" : "text-gray-400"}`}
    >
      {hasValue && swatch(selectedOptions[0].color)}
      <span className="truncate">
        {hasValue ? selectedOptions[0].label : placeholder}
      </span>
    </span>
  );

  const showClear = isClearable && hasValue && !isDisabled;

  const trigger = (
    <div
      ref={triggerRef}
      role="button"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-disabled={isDisabled}
      aria-label={accessibleName}
      tabIndex={isDisabled ? -1 : 0}
      onClick={isMobile ? () => handleOpenChange(true) : undefined}
      onKeyDown={
        isMobile
          ? (e: KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenChange(true);
              }
            }
          : undefined
      }
      className={`flex w-full cursor-pointer items-center gap-2 bg-white outline-none transition-colors focus-visible:border-gray-900 ${
        SIZE_CLASSES[size]
      } ${showClear ? "pr-14" : ""} ${
        showInvalid
          ? "border-red-400"
          : open
            ? "border-gray-900"
            : "border-gray-200 hover:border-gray-400"
      } ${isDisabled ? "pointer-events-none opacity-50" : ""}`}
    >
      <div className="min-w-0 flex-1">{triggerContent}</div>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`shrink-0 text-xs text-gray-400 transition-transform ${
            open && !isMobile ? "rotate-180" : ""
          }`}
        />
      )}
    </div>
  );

  // Hidden input: carries the value for native forms and enforces `isRequired`
  const formValue = [...selectedKeys].join(",");

  return (
    <div className={cn("relative flex w-full flex-col gap-1.5", className)}>
      {(label || labelEnd) && (
        <div className="flex items-center gap-2">
          {label && (
            <label className="text-sm font-semibold text-gray-700">
              {label}
              {isRequired && <span className="ml-0.5 text-red-500">*</span>}
            </label>
          )}
          {labelEnd}
        </div>
      )}

      {/* Clicks inside the portaled list still bubble through React to our
          parents; stop them so "click outside to close" handlers ignore them */}
      <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
        {isMobile ? (
          <>
            {trigger}
            <Modal
              isOpen={open}
              onOpenChange={handleOpenChange}
              placement="center"
              scrollBehavior="inside"
              backdrop="opaque"
              size="sm"
              portalContainer={modalContainer}
              classNames={{ base: "mx-4 max-h-[80vh] rounded-2xl" }}
            >
              <ModalContent>
                {(onClose) => (
                  <>
                    <ModalHeader className="flex flex-col gap-3 pb-2">
                      <span className="text-base font-bold text-gray-900">
                        {accessibleName}
                      </span>
                      {searchBox}
                      {chips(true)}
                    </ModalHeader>
                    <ModalBody className="px-2 pb-3 pt-0">{list}</ModalBody>
                    {isMulti && (
                      <ModalFooter className="pt-2">
                        <Button
                          fullWidth
                          className="bg-gray-900 font-semibold text-white"
                          onPress={onClose}
                        >
                          Done
                        </Button>
                      </ModalFooter>
                    )}
                  </>
                )}
              </ModalContent>
            </Modal>
          </>
        ) : (
          <Popover
            isOpen={open}
            onOpenChange={handleOpenChange}
            placement="bottom"
            offset={6}
            disableAnimation
            shouldFlip
            portalContainer={portalContainer}
            classNames={{ content: "p-0 rounded-xl border border-gray-200" }}
          >
            <PopoverTrigger>{trigger}</PopoverTrigger>
            <PopoverContent>
              <div
                className="flex flex-col gap-2 p-2"
                style={{ width: triggerWidth, minWidth: 200 }}
              >
                {searchBox}
                <div className="max-h-64 overflow-y-auto">{list}</div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showClear && (
          <button
            type="button"
            aria-label={`Clear ${accessibleName}`}
            onClick={clearAll}
            className="absolute right-7 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <FontAwesomeIcon icon={faXmark} className="text-xs" />
          </button>
        )}

        {(name || isRequired) && (
          <input
            tabIndex={-1}
            aria-hidden
            name={name}
            required={isRequired}
            value={formValue}
            onChange={() => {}}
            onInvalid={() => setInvalid(true)}
            className="pointer-events-none absolute bottom-0 left-1/2 h-px w-px opacity-0"
          />
        )}
      </div>

      {props.isInvalid && errorMessage && (
        <p className="text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
