# Copyright (c) 2022-2023 Antmicro <www.antmicro.com>
#
# SPDX-License-Identifier: Apache-2.0

"""
Provides function for creating FastAPI application.
"""

import os
import shutil
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pipeline_manager import frontend

local_dist_path = Path(os.path.dirname(frontend.__file__)) / "dist"


def _resolve_dist_path() -> Path:
    """
    Resolves the path to the built frontend.

    Returns
    -------
    Path
        Path to the built frontend. Preference order: local build,
        then the prebuilt package, then the (possibly nonexistent)
        local path.
    """
    if local_dist_path.exists():
        return local_dist_path
    try:
        from pipeline_manager_prebuilt_frontend import (
            dist_path as prebuilt_dist_path,
        )
    except ImportError:
        return local_dist_path
    if prebuilt_dist_path.exists():
        return prebuilt_dist_path
    return local_dist_path


dist_path = _resolve_dist_path()


def create_app(
    frontend_dir: Optional[Path] = None, relative_pm_url: Optional[Path] = None
) -> FastAPI:
    """
    Hosts frontend application.

    Parameters
    ----------
    frontend_dir : Optional[Path]
        Path where the built frontend is stored.
    relative_pm_url : Optional[Path]
        Path in URL where Pipeline Manager should be served

    Returns
    -------
    FastAPI
        FastAPI instance
    """
    app = FastAPI(title="Pipeline Manager")

    if not frontend_dir:
        frontend_dir = dist_path
    elif relative_pm_url:
        if relative_pm_url.is_relative_to("/"):
            relative_pm_url = relative_pm_url.relative_to("/")

        shutil.copytree(
            dist_path,
            frontend_dir / relative_pm_url,
            dirs_exist_ok=True,
        )
    app.mount(
        "/", StaticFiles(directory=frontend_dir, html=True), name="static"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_headers=["*"],
        allow_methods=["GET"],
        max_age=None,
    )

    return app
