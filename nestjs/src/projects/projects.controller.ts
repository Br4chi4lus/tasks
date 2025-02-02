import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProjectDTO } from './dtos/create.project.dto';
import { ProjectDTO } from './dtos/project.dto';
import { ProjectsService } from './projects.service';
import { UserEntity } from '../users/entities/user.entity';
import { OwnershipGuard } from '../auth/guards/ownership.guard';
import { StateOfProjectDTO } from './dtos/state-of-project.dto';
import { ParticipantGuard } from '../auth/guards/participant.guard';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Unauthorized user, insufficient credentials',
})
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectService: ProjectsService) {}

  @Post()
  @Roles('Manager', 'Admin')
  @ApiCreatedResponse({ description: 'New project has been created' })
  @ApiNotFoundResponse({ description: 'Some of the users were not found' })
  async create(
    @Body() dto: CreateProjectDTO,
    @Req() request,
  ): Promise<ProjectDTO> {
    const user = request.user as UserEntity;
    const project = await this.projectService.createProject(dto, user.id);
    return ProjectDTO.fromEntity(project);
  }

  @Roles('Admin', 'Manager')
  @Get()
  @ApiOkResponse({ description: 'Projects have been successfully retrieved' })
  async findAll(): Promise<ProjectDTO[]> {
    const projects = await this.projectService.findAll();
    return projects.map((project) => ProjectDTO.fromEntity(project));
  }
  @Get('states')
  async getAllStatesOfProject(): Promise<StateOfProjectDTO[]> {
    const states = await this.projectService.findAllStates();

    return states.map((state) => StateOfProjectDTO.fromEntity(state));
  }
  @Get(':projectId')
  @UseGuards(ParticipantGuard)
  @ApiOkResponse({ description: 'Project has been successfully retrieved' })
  @ApiNotFoundResponse({ description: 'Project was not found' })
  async findOne(
    @Param('projectId', new ParseIntPipe()) projectId: number,
  ): Promise<ProjectDTO> {
    const project = await this.projectService.findOne(projectId);

    return ProjectDTO.fromEntity(project);
  }

  @UseGuards(OwnershipGuard)
  @Put(':projectId')
  @ApiNotFoundResponse({ description: 'Project/State was not found' })
  async updateStateOfProject(
    @Param('projectId', new ParseIntPipe()) projectId: number,
    @Body() dto: StateOfProjectDTO,
  ): Promise<ProjectDTO> {
    const updatedProject = await this.projectService.updateStateOfProject(
      projectId,
      dto.state,
    );

    return ProjectDTO.fromEntity(updatedProject);
  }
}